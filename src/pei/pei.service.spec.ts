import { PeiService } from './pei.service';

describe('PeiService.filtro — vbMapp (ordenação por id dentro do programa)', () => {
  const buildVbmappRow = (id: number, respostaSessao: string) => ({
    id: id * 100, // id do VBMappResultado (registro da resposta), não o do item
    respostaSessao,
    estimuloDiscriminativo: null,
    resposta: null,
    estimuloReforcadorPositivo: null,
    procedimentoEnsinoId: null,
    subitems: null,
    createdAt: new Date(),
    paciente: { id: 79, nome: 'Paciente Teste', dataNascimento: '2020-01-01' },
    vbmapp: {
      id,
      nome: `item ${id}`,
      nivel: 1,
      programaId: 18,
      programa: { id: 18, nome: 'Mando' },
    },
  });

  const buildService = (rows: any[]) => {
    const prisma = {
      vBMappResultado: { findMany: jest.fn().mockResolvedValue(rows) },
    };

    const service = new PeiService({ getPrismaClient: () => prisma } as any);

    return { service, prisma };
  };

  it('retorna os itens do vbMapp ordenados por id dentro do programa, mesmo vindo embaralhados do banco', async () => {
    // Reproduz a ordem observada com dados reais do paciente 79
    // (orderBy createdAt desc): o banco não devolve por id.
    const rowsForaDeOrdem = [
      buildVbmappRow(4, '0.5'),
      buildVbmappRow(2, '1'),
      buildVbmappRow(5, '1'),
      buildVbmappRow(1, '1'),
      buildVbmappRow(3, '1'),
    ];

    const { service } = buildService(rowsForaDeOrdem);

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 2, nome: 'VB Mapp' },
    });

    const mando = result.find((grupo: any) => grupo.programa.nome === 'Mando');

    expect(mando.metas.map((meta: any) => meta.id)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('PeiService.activitySession — árvores no formato final de slots (item 7)', () => {
  const buildService = (atividadeSessaoRow: any) => {
    const prisma = {
      atividadeSessao: {
        findMany: jest.fn().mockResolvedValue([atividadeSessaoRow]),
      },
    };

    const service = new PeiService({ getPrismaClient: () => prisma } as any);

    return { service };
  };

  it('preenche a árvore de atividades (Manual) com 10 slots por folha, a partir de children cru', async () => {
    const { service } = buildService({
      atividades: [
        {
          key: '1',
          label: 'Programa',
          children: [
            { key: '1-1', label: 'Meta', children: ['C', 'C', null] },
          ],
        },
      ],
      maintenance: null,
      portage: [],
      selectedPortageKeys: null,
      vbmapp: [],
      selectedVbMappKeys: null,
      selectedMaintenanceKeys: {},
    });

    const result: any = await service.activitySession(79);

    const meta = result.atividades[0].children[0];
    expect(meta.children).toHaveLength(10);
    expect(meta.children).toEqual(['C', 'C', null, null, null, null, null, null, null, null]);
  });

  it('é idempotente: rodar de novo sobre uma árvore já no formato final não muda nada', async () => {
    const jaFinal = {
      key: '1',
      label: 'Programa',
      estimuloDiscriminativo: '',
      estimuloReforcadorPositivo: '',
      resposta: '',
      children: [
        {
          key: '1-1',
          label: 'Meta',
          estimuloDiscriminativo: '',
          estimuloReforcadorPositivo: '',
          resposta: '',
          children: ['C', 'C', null, null, null, null, null, null, null, null],
        },
      ],
    };

    const { service } = buildService({
      atividades: [jaFinal],
      maintenance: null,
      portage: [],
      selectedPortageKeys: null,
      vbmapp: [],
      selectedVbMappKeys: null,
      selectedMaintenanceKeys: {},
    });

    const result: any = await service.activitySession(79);

    expect(result.atividades[0]).toEqual(jaFinal);
  });

  it('VB-MAPP: subitem folha carrega permiteSubitens e 10 slots', async () => {
    const { service } = buildService({
      atividades: [],
      maintenance: null,
      portage: [],
      selectedPortageKeys: null,
      vbmapp: [
        {
          key: 'nivel-1',
          label: 'Nível 1',
          children: [
            {
              key: 'meta-1',
              label: 'Meta',
              children: [
                { key: 'sub-1', label: 'Subitem', permiteSubitens: true },
              ],
            },
          ],
        },
      ],
      selectedVbMappKeys: {
        'nivel-1': true,
        'meta-1': true,
        'sub-1': true,
      },
      selectedMaintenanceKeys: {},
    });

    const result: any = await service.activitySession(79);

    const subitem = result.vbmapp[0].children[0].children[0];
    expect(subitem.permiteSubitens).toBe(true);
    expect(subitem.children).toHaveLength(10);
    expect(subitem.children.every((v: any) => v === null)).toBe(true);
  });
});
