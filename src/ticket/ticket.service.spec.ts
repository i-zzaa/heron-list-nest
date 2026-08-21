import { TicketService } from './ticket.service';

const buildService = (prisma: any) =>
  new TicketService({ getPrismaClient: () => prisma } as any);

describe('TicketService', () => {
  it('getAll pagina e ordena por nome, só entre os ativos', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Chamado 1' }]);
    const count = jest.fn().mockResolvedValue(1);
    const service = buildService({ ticket: { findMany, count } });

    const result = await service.getAll(1, 10);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { nome: 'asc' },
        where: { ativo: true },
        skip: 0,
        take: 10,
      }),
    );
    expect(count).toHaveBeenCalledWith({ where: { ativo: true } });
    expect(result.data).toEqual([{ id: 1, nome: 'Chamado 1' }]);
    expect(result.pagination.total).toBe(1);
  });

  // PUT /ticket com ativo:false é a forma de "excluir" (soft delete, mesmo
  // padrão de Especialidade) — o ticket some da listagem paginada, sem
  // sair do banco (baixas antigas continuam com o vínculo intacto).
  it('ticket desativado (ativo:false) não aparece na listagem paginada', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const service = buildService({ ticket: { findMany, count } });

    const result = await service.getAll(1, 10);

    expect(findMany.mock.calls[0][0].where).toEqual({ ativo: true });
    expect(result.data).toEqual([]);
  });

  it('dropdown devolve id/nome só dos tickets ativos', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Chamado 1' }]);
    const service = buildService({ ticket: { findMany } });

    const result = await service.dropdown();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ativo: true } }),
    );
    expect(result).toEqual([{ id: 1, nome: 'Chamado 1' }]);
  });

  it('search filtra por nome contendo o texto buscado, só entre os ativos', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = buildService({ ticket: { findMany } });

    await service.search('adm');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true, OR: [{ nome: { contains: 'adm' } }] },
      }),
    );
  });

  it('create grava nome e ativo', async () => {
    const create = jest.fn().mockResolvedValue({ id: 1, nome: 'Chamado 1' });
    const service = buildService({ ticket: { create } });

    await service.create({ nome: 'Chamado 1', outroCampo: 'ignorado' });

    expect(create).toHaveBeenCalledWith({ data: { nome: 'Chamado 1' } });
  });

  it('update desativa o ticket (ativo:false) sem excluir', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1, ativo: false });
    const service = buildService({ ticket: { update } });

    await service.update({ id: 1, nome: 'Chamado 1', ativo: false });

    expect(update).toHaveBeenCalledWith({
      data: { nome: 'Chamado 1', ativo: false },
      where: { id: 1 },
    });
  });

  // Replanejado: exclusão não é mais bloqueada quando em uso — decide
  // sozinha entre soft (desativa) e hard delete.
  describe('delete', () => {
    it('desativa (ativo:false) em vez de excluir quando está vinculado a alguma baixa', async () => {
      const del = jest.fn();
      const update = jest.fn().mockResolvedValue({ id: 1, ativo: false });
      const service = buildService({
        ticket: { delete: del, update },
        baixa: { count: jest.fn().mockResolvedValue(1) },
      });

      const result = await service.delete(1);

      expect(update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ativo: false },
      });
      expect(del).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 1, ativo: false });
    });

    it('exclui fisicamente quando não tem nenhum vínculo', async () => {
      const del = jest.fn().mockResolvedValue({ id: 1 });
      const update = jest.fn();
      const service = buildService({
        ticket: { delete: del, update },
        baixa: { count: jest.fn().mockResolvedValue(0) },
      });

      await service.delete(1);

      expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(update).not.toHaveBeenCalled();
    });
  });
});
