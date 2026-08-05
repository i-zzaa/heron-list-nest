import { EspecialidadeService } from './especialidade.service';

describe('EspecialidadeService.delete (R20)', () => {
  const buildService = (counts: Record<string, number>) => {
    const prisma = {
      especialidade: { delete: jest.fn().mockResolvedValue({ id: 1 }) },
      calendario: { count: jest.fn().mockResolvedValue(counts.calendario ?? 0) },
      terapeuta: { count: jest.fn().mockResolvedValue(counts.terapeuta ?? 0) },
      vagaOnEspecialidade: {
        count: jest.fn().mockResolvedValue(counts.vagaOnEspecialidade ?? 0),
      },
      funcao: { count: jest.fn().mockResolvedValue(counts.funcao ?? 0) },
    };

    const service = new EspecialidadeService({
      getPrismaClient: () => prisma,
    } as any);

    return { service, prisma };
  };

  it('bloqueia exclusão quando há evento vinculado', async () => {
    const { service, prisma } = buildService({ calendario: 2 });

    await expect(service.delete(1)).rejects.toThrow(/em uso/);
    expect(prisma.especialidade.delete).not.toHaveBeenCalled();
  });

  it('bloqueia exclusão quando há terapeuta com essa especialidade', async () => {
    const { service, prisma } = buildService({ terapeuta: 1 });

    await expect(service.delete(1)).rejects.toThrow(/em uso/);
    expect(prisma.especialidade.delete).not.toHaveBeenCalled();
  });

  it('exclui normalmente quando não está em uso em lugar nenhum', async () => {
    const { service, prisma } = buildService({});

    await service.delete(1);

    expect(prisma.especialidade.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
