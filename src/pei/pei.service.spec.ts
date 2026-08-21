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
