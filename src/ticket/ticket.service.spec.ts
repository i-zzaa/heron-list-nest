import { TicketService } from './ticket.service';

const buildService = (prisma: any) =>
  new TicketService({ getPrismaClient: () => prisma } as any);

describe('TicketService', () => {
  it('getAll pagina e ordena por nome', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Chamado 1' }]);
    const count = jest.fn().mockResolvedValue(1);
    const service = buildService({ ticket: { findMany, count } });

    const result = await service.getAll(1, 10);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nome: 'asc' }, skip: 0, take: 10 }),
    );
    expect(result.data).toEqual([{ id: 1, nome: 'Chamado 1' }]);
    expect(result.pagination.total).toBe(1);
  });

  it('dropdown devolve id/nome de todos os tickets', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Chamado 1' }]);
    const service = buildService({ ticket: { findMany } });

    const result = await service.dropdown();

    expect(result).toEqual([{ id: 1, nome: 'Chamado 1' }]);
  });

  it('search filtra por nome contendo o texto buscado', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = buildService({ ticket: { findMany } });

    await service.search('adm');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ nome: { contains: 'adm' } }] },
      }),
    );
  });

  it('create grava só o nome', async () => {
    const create = jest.fn().mockResolvedValue({ id: 1, nome: 'Chamado 1' });
    const service = buildService({ ticket: { create } });

    await service.create({ nome: 'Chamado 1', outroCampo: 'ignorado' });

    expect(create).toHaveBeenCalledWith({ data: { nome: 'Chamado 1' } });
  });

  it('delete bloqueia exclusão quando o ticket está vinculado a alguma baixa', async () => {
    const del = jest.fn();
    const service = buildService({
      ticket: { delete: del },
      baixa: { count: jest.fn().mockResolvedValue(1) },
    });

    await expect(service.delete(1)).rejects.toThrow(/em uso/);
    expect(del).not.toHaveBeenCalled();
  });

  it('delete exclui normalmente quando não está em uso', async () => {
    const del = jest.fn().mockResolvedValue({ id: 1 });
    const service = buildService({
      ticket: { delete: del },
      baixa: { count: jest.fn().mockResolvedValue(0) },
    });

    await service.delete(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
