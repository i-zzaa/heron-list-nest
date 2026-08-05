import { StatusEventoService } from './status-evento.service';

describe('StatusEventoService.delete (R20)', () => {
  const buildService = (counts: Record<string, number>) => {
    const prisma = {
      statusEventos: { delete: jest.fn().mockResolvedValue({ id: 9 }) },
      calendario: { count: jest.fn().mockResolvedValue(counts.calendario ?? 0) },
      baixa: { count: jest.fn().mockResolvedValue(counts.baixa ?? 0) },
    };

    const service = new StatusEventoService({
      getPrismaClient: () => prisma,
    } as any);

    return { service, prisma };
  };

  it('bloqueia exclusão quando há evento com esse status', async () => {
    const { service, prisma } = buildService({ calendario: 5 });

    await expect(service.delete(9)).rejects.toThrow(/em uso/);
    expect(prisma.statusEventos.delete).not.toHaveBeenCalled();
  });

  it('bloqueia exclusão quando há baixa com esse status', async () => {
    const { service, prisma } = buildService({ baixa: 1 });

    await expect(service.delete(9)).rejects.toThrow(/em uso/);
  });

  it('exclui normalmente quando não está em uso', async () => {
    const { service, prisma } = buildService({});

    await service.delete(9);

    expect(prisma.statusEventos.delete).toHaveBeenCalledWith({
      where: { id: 9 },
    });
  });
});
