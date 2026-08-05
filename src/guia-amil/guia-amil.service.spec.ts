import { GuiaAmilService } from './guia-amil.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('GuiaAmilService', () => {
  let service: GuiaAmilService;

  beforeEach(() => {
    delete process.env.AMIL_MOCK_MODE;
    service = new GuiaAmilService({} as PrismaService);
  });

  it('should list guides for dropdown', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValue([
        {
          id: 1,
          numeroGuia: 'G-001',
          tipoGuia: 'CONSULTA',
          status: 'RASCUNHO',
          paciente: { id: 1, nome: 'Paciente' },
        },
      ]);

    const prisma = {
      guiaAmil: {
        findMany,
      },
    };

    (service as any).prismaService = {
      getPrismaClient: () => prisma,
    };

    const result = await service.dropdown();

    expect(findMany).toHaveBeenCalled();
    expect(result[0]).toMatchObject({ id: 1, numeroGuia: 'G-001' });
  });

  it('should return mock guide data when mock mode is enabled', async () => {
    process.env.AMIL_MOCK_MODE = 'true';

    const result = await service.dropdown();

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({
      numeroGuia: 'GUIA-MOCK-001',
      tipoGuia: 'CONSULTA',
    });
  });

  it('should return paginated guide list when mock mode is enabled', async () => {
    process.env.AMIL_MOCK_MODE = 'true';

    const result = await service.list({ page: 1, limit: 10 } as any);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(result.pagination).toMatchObject({ currentPage: 1, pageSize: 10 });
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should test amil connection in mock mode', async () => {
    process.env.AMIL_MOCK_MODE = 'true';

    const result = await service.testarConexao();

    expect(result.sucesso).toBe(true);
    expect(result.mock).toBe(true);
  });

  it('should create a draft guide', async () => {
    const create = jest.fn().mockResolvedValue({ id: 1, status: 'RASCUNHO' });

    const prisma = {
      guiaAmil: {
        create,
      },
    };

    (service as any).prismaService = {
      getPrismaClient: () => prisma,
    };

    const result = await service.create({
      numeroGuia: 'G-001',
      tipoGuia: 'CONSULTA',
      pacienteId: 1,
      sessaoId: 1,
      prestadorId: 1,
      dadosGuia: {},
      valorTotal: 100,
    } as any);

    expect(result.status).toBe('RASCUNHO');
    expect(create).toHaveBeenCalled();
  });

  it('should prepare a guide for sending', async () => {
    const update = jest
      .fn()
      .mockResolvedValue({ id: 1, status: 'PRONTA_PARA_ENVIO' });

    const prisma = {
      guiaAmil: {
        update,
      },
    };

    (service as any).prismaService = {
      getPrismaClient: () => prisma,
    };

    const result = await service.prepararEnvio(1, { idUsuario: 1 } as any);

    expect(result.status).toBe('PRONTA_PARA_ENVIO');
    expect(update).toHaveBeenCalled();
  });
});
