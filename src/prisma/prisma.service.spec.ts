import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('aquece o pool com várias conexões em paralelo no onModuleInit', async () => {
    const service = new PrismaService();
    const queryRawUnsafe = jest.fn().mockResolvedValue([{ 1: 1 }]);

    (service as any).prisma = { $queryRawUnsafe: queryRawUnsafe };

    await service.onModuleInit();

    // Mais de uma conexão aquecida — o ponto é evitar que a primeira rajada
    // de requisições reais pague, uma por uma, o custo de abrir conexão
    // nova (~800ms medido contra o banco real da hospedagem).
    expect(queryRawUnsafe.mock.calls.length).toBeGreaterThan(1);
    expect(queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
  });

  it('onModuleDestroy desconecta o client', async () => {
    const service = new PrismaService();
    const disconnect = jest.fn().mockResolvedValue(undefined);

    (service as any).prisma = { $disconnect: disconnect };

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalled();
  });
});
