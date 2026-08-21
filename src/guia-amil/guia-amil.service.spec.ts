import { GuiaAmilService } from './guia-amil.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('GuiaAmilService', () => {
  let service: GuiaAmilService;

  beforeEach(() => {
    delete process.env.AMIL_MOCK_MODE;
    service = new GuiaAmilService({} as PrismaService);
  });

  // Item 11 dos "pontos menores" (heron-list-web): dropdown() devolvia uma
  // listagem de guias (redundante com list()) em vez das opções que o
  // front realmente precisa pro formulário (status/origens).
  it('devolve as opções de status a partir do catálogo real (GUIA_AMIL_STATUS), sem tocar o banco', () => {
    const result = service.dropdown();

    expect(result.status).toContainEqual({ id: 'RASCUNHO', nome: 'RASCUNHO' });
    expect(result.status).toContainEqual({ id: 'ENVIADA', nome: 'ENVIADA' });
    expect(result.status.length).toBeGreaterThan(1);
  });

  it('devolve origens com a única opção conhecida no código (MANUAL)', () => {
    const result = service.dropdown();

    expect(result.origens).toEqual([{ id: 'MANUAL', nome: 'Manual' }]);
  });

  it('should return paginated guide list when mock mode is enabled', async () => {
    process.env.AMIL_MOCK_MODE = 'true';

    const result = await service.list({ page: 1, limit: 10 } as any);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(result.pagination).toMatchObject({ page: 1, pageSize: 10 });
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
