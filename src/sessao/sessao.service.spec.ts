import { SessaoService } from './sessao.service';

const buildService = (sessoes: any[]) => {
  const prisma = {
    sessao: { findMany: jest.fn().mockResolvedValue(sessoes) },
  };

  const service = new SessaoService(
    { getPrismaClient: () => prisma } as any,
    {} as any,
  );

  return { service, prisma };
};

// item-folha: `children` é o array de respostas DTT cru (C = certo).
const itemFolha = (label: string, respostas: string[]) => ({
  label,
  children: respostas,
});

describe('SessaoService.getAtividadeSessaoByPacient — Manual/VB-MAPP/Portage', () => {
  const evento = { dataInicio: '2026-09-04' };

  it('processa o Manual (programa->meta->item), comportamento original preservado', async () => {
    const sessaoManual = [
      {
        label: 'Comportamental',
        children: [
          {
            label: 'meta',
            children: [itemFolha('5 segundos', ['C', 'C', 'DT', 'C'])],
          },
        ],
      },
    ];

    const { service } = buildService([
      { sessao: sessaoManual, vbmapp: null, portage: null, evento },
    ]);

    const result: any = await service.getAtividadeSessaoByPacient(79);

    expect(result).toEqual([
      {
        programa: 'Comportamental',
        children: [
          {
            programa: '5 segundos',
            dias: [{ primeiraResposta: true, data: '04/09/2026', porcentagem: '75.00' }],
          },
        ],
        qtdColumns: 1,
      },
    ]);
  });

  it('processa o Portage (metas na raiz->item, sem nível de programa acima)', async () => {
    const sessaoPortage = [
      {
        label: 'Socialização',
        children: [itemFolha('Sorri', ['C', 'C'])],
      },
    ];

    const { service } = buildService([
      { sessao: [], vbmapp: null, portage: sessaoPortage, evento },
    ]);

    const result: any = await service.getAtividadeSessaoByPacient(79);

    expect(result).toEqual([
      {
        programa: 'Socialização',
        children: [
          {
            programa: 'Sorri',
            dias: [{ primeiraResposta: true, data: '04/09/2026', porcentagem: '100.00' }],
          },
        ],
        qtdColumns: 1,
      },
    ]);
  });

  it('processa o VB-MAPP (nível->programa->meta->item, achatando o nível)', async () => {
    const sessaoVbmapp = [
      {
        label: 'Nível 1',
        children: [
          {
            label: 'Mando',
            children: [
              {
                label: 'meta',
                children: [itemFolha('Pede água', ['C', 'DT'])],
              },
            ],
          },
        ],
      },
    ];

    const { service } = buildService([
      { sessao: [], vbmapp: sessaoVbmapp, portage: null, evento },
    ]);

    const result: any = await service.getAtividadeSessaoByPacient(79);

    expect(result).toEqual([
      {
        programa: 'Mando',
        children: [
          {
            programa: 'Pede água',
            dias: [{ primeiraResposta: true, data: '04/09/2026', porcentagem: '50.00' }],
          },
        ],
        qtdColumns: 1,
      },
    ]);
  });

  it('combina os 3 protocolos na mesma sessão, cada um com seu próprio agrupamento', async () => {
    const sessaoManual = [
      { label: 'Comportamental', children: [{ label: 'meta', children: [itemFolha('5 segundos', ['C'])] }] },
    ];
    const sessaoVbmapp = [
      { label: 'Nível 1', children: [{ label: 'Mando', children: [{ label: 'meta', children: [itemFolha('Pede água', ['C'])] }] }] },
    ];
    const sessaoPortage = [
      { label: 'Socialização', children: [itemFolha('Sorri', ['C'])] },
    ];

    const { service } = buildService([
      { sessao: sessaoManual, vbmapp: sessaoVbmapp, portage: sessaoPortage, evento },
    ]);

    const result: any = await service.getAtividadeSessaoByPacient(79);

    expect(result.map((r: any) => r.programa).sort()).toEqual([
      'Comportamental',
      'Mando',
      'Socialização',
    ]);
  });

  it('sessão sem vbmapp/portage (null) não quebra — só processa o Manual', async () => {
    const sessaoManual = [
      { label: 'Comportamental', children: [{ label: 'meta', children: [itemFolha('5 segundos', ['C'])] }] },
    ];

    const { service } = buildService([
      { sessao: sessaoManual, vbmapp: null, portage: null, evento },
    ]);

    await expect(
      service.getAtividadeSessaoByPacient(79),
    ).resolves.toHaveLength(1);
  });
});
