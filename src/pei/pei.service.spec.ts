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

describe('PeiService.filtro — protocolo Manual (agrupamento por programa, sem VB-MAPP misturado)', () => {
  const buildPeiRow = (id: number, over: any = {}) => ({
    id,
    estimuloDiscriminativo: `estimulo ${id}`,
    estimuloReforcadorPositivo: `reforcador ${id}`,
    procedimentoEnsinoId: 1,
    metas: [{ id: `${id}-meta-0`, value: `meta ${id}` }],
    programa: { id: 3, nome: 'Comportamental' },
    resposta: `resposta ${id}`,
    paciente: { id: 79, nome: 'GABRIEL LUIS GUIDO' },
    ...over,
  });

  const buildService = (peiRows: any[], vbmappRows: any[] = []) => {
    const prisma = {
      pei: { findMany: jest.fn().mockResolvedValue(peiRows) },
      vBMappResultado: { findMany: jest.fn().mockResolvedValue(vbmappRows) },
    };

    const service = new PeiService({ getPrismaClient: () => prisma } as any);

    return { service, prisma };
  };

  it('nunca mistura itens do VB-MAPP (Mando/Tato/etc.) no resultado do protocolo Manual', async () => {
    const { service, prisma } = buildService(
      [buildPeiRow(67)],
      [{ id: 1, respostaSessao: '0.5', vbmapp: { id: 2, nome: 'x', programa: { id: 18, nome: 'Mando' } } }],
    );

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 3, nome: 'Manual' },
    });

    // getVbmappMetas (vBMappResultado) nem deveria ser consultado no case Manual.
    expect(prisma.vBMappResultado.findMany).not.toHaveBeenCalled();
    expect(result.some((grupo: any) => grupo.programa.nome === 'Mando')).toBe(false);
  });

  it('agrupa vários registros do mesmo programa num item só, com peiIds de todos os registros originais', async () => {
    const { service } = buildService([
      buildPeiRow(67, { metas: [{ id: '67-meta-0', value: 'Criança esperar' }] }),
      buildPeiRow(68, { metas: [{ id: '68-meta-0', value: 'Sentar' }] }),
      buildPeiRow(69, { metas: [{ id: '69-meta-0', value: 'Levantar' }] }),
    ]);

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 3, nome: 'Manual' },
    });

    // 1 item só pro programa "Comportamental" (não 3, um por registro Pei).
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(67); // canônico: o primeiro do grupo
    expect(result[0].programa).toEqual({ id: 3, nome: 'Comportamental' });
    expect(result[0].peiIds).toEqual([67, 68, 69]);
    expect(result[0].metas.map((m: any) => m.value)).toEqual([
      'Criança esperar',
      'Sentar',
      'Levantar',
    ]);
  });

  it('metas com o mesmo texto se mesclam (subitems combinados), em vez de duplicar', async () => {
    const { service } = buildService([
      buildPeiRow(67, {
        metas: [
          {
            id: '67-meta-0',
            value: 'Criança esperar',
            subitems: [{ id: '67-meta-0-sub-item-0', value: '5 segundos' }],
          },
        ],
      }),
      buildPeiRow(68, {
        // Mesmo texto da meta acima, com espaço nas pontas (dado real:
        // variação de digitação entre registros) — deve mesclar, não
        // duplicar a meta.
        metas: [
          {
            id: '68-meta-0',
            value: ' Criança esperar ',
            subitems: [{ id: '68-meta-0-sub-item-0', value: '10 segundos' }],
          },
        ],
      }),
    ]);

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 3, nome: 'Manual' },
    });

    expect(result).toHaveLength(1);
    expect(result[0].metas).toHaveLength(1); // não duplicou a meta
    expect(result[0].metas[0].subitems.map((s: any) => s.value)).toEqual([
      '5 segundos',
      '10 segundos',
    ]);
  });

  it('reindexa os ids das metas após mesclar, mesmo quando registros diferentes geram o mesmo id sintético pra metas diferentes', async () => {
    // Dado real: registro 67 e registro 69 (mesmo programa) os dois
    // geraram uma meta com id "3-meta-0" — mas com valores DIFERENTES
    // ("Criança esperar" vs "Sentar"). Sem reindexar, o formulário de
    // edição usaria esse id como chave e uma meta sobrescreveria a outra.
    const { service } = buildService([
      buildPeiRow(67, { metas: [{ id: '3-meta-0', value: 'Criança esperar' }] }),
      buildPeiRow(69, { metas: [{ id: '3-meta-0', value: 'Sentar' }] }),
    ]);

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 3, nome: 'Manual' },
    });

    const metas = result[0].metas;
    expect(metas).toHaveLength(2); // valores diferentes, não mescla
    expect(new Set(metas.map((m: any) => m.id)).size).toBe(2); // ids não colidem mais
    expect(metas.map((m: any) => m.id)).toEqual(['3-meta-0', '3-meta-1']);
  });

  it('subitem com o mesmo texto também não duplica ao mesclar', async () => {
    const { service } = buildService([
      buildPeiRow(67, {
        metas: [
          {
            id: '67-meta-0',
            value: 'Criança esperar',
            subitems: [{ id: '67-meta-0-sub-item-0', value: '5 segundos' }],
          },
        ],
      }),
      buildPeiRow(68, {
        metas: [
          {
            id: '68-meta-0',
            value: 'Criança esperar',
            subitems: [{ id: '68-meta-0-sub-item-0', value: '5 segundos' }],
          },
        ],
      }),
    ]);

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 3, nome: 'Manual' },
    });

    expect(result[0].metas[0].subitems).toHaveLength(1);
  });

  it('programas diferentes viram itens separados', async () => {
    const { service } = buildService([
      buildPeiRow(67, { programa: { id: 3, nome: 'Comportamental' } }),
      buildPeiRow(70, { programa: { id: 4, nome: 'Social' } }),
    ]);

    const result: any = await service.filtro({
      paciente: { id: 79 },
      protocoloId: { id: 3, nome: 'Manual' },
    });

    expect(result).toHaveLength(2);
    expect(result.map((g: any) => g.programa.nome).sort()).toEqual([
      'Comportamental',
      'Social',
    ]);
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

describe('PeiService.update — edição em nível de protocolo (consolidação de peiIds)', () => {
  const buildService = () => {
    const prisma = {
      pei: {
        update: jest.fn().mockResolvedValue({ id: 67 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const service = new PeiService({ getPrismaClient: () => prisma } as any);

    return { service, prisma };
  };

  it('grava só no registro canônico (body.id) e apaga os demais registros do grupo (peiIds)', async () => {
    const { service, prisma } = buildService();

    await service.update({
      id: 67,
      peiIds: [67, 68, 69],
      pacienteId: 79,
      programaId: 3,
      procedimentoEnsinoId: 1,
      estimuloDiscriminativo: 'x',
      resposta: 'y',
      estimuloReforcadorPositivo: 'z',
      metas: [{ id: '67-meta-0', value: 'Criança esperar' }],
    });

    expect(prisma.pei.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 67 } }),
    );
    expect(prisma.pei.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [68, 69] } },
    });
  });

  it('sem peiIds (edição avulsa), não apaga nada — comportamento de sempre', async () => {
    const { service, prisma } = buildService();

    await service.update({ id: 67, pacienteId: 79, programaId: 3, metas: [] });

    expect(prisma.pei.deleteMany).not.toHaveBeenCalled();
  });

  it('quando o grupo tem só o registro canônico, não chama deleteMany à toa', async () => {
    const { service, prisma } = buildService();

    await service.update({ id: 67, peiIds: [67], pacienteId: 79, programaId: 3, metas: [] });

    expect(prisma.pei.deleteMany).not.toHaveBeenCalled();
  });
});
