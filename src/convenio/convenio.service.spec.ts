import { ConvenioService } from './convenio.service';

const buildService = (prisma: any) =>
  new ConvenioService({ getPrismaClient: () => prisma } as any);

describe('ConvenioService.getAll', () => {
  // Faltava a listagem paginada — GET /convenio?page=&pageSize= caía em
  // 404 (só existia dropdown/search), mesmo bug já corrigido antes em
  // Especialidade.
  it('pagina e ordena por nome', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Unimed' }]);
    const count = jest.fn().mockResolvedValue(1);
    const service = buildService({ convenio: { findMany, count } });

    const result = await service.getAll(1, 10);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nome: 'asc' }, skip: 0, take: 10 }),
    );
    expect(result.data).toEqual([{ id: 1, nome: 'Unimed' }]);
    expect(result.pagination).toMatchObject({ page: 1, pageSize: 10, total: 1 });
  });

  it('calcula o skip pra páginas além da primeira', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const service = buildService({ convenio: { findMany, count } });

    await service.getAll(3, 10);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });
});
