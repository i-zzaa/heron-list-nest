import { BaixaService } from './baixa.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('BaixaService', () => {
  let service: BaixaService;

  beforeEach(() => {
    service = new BaixaService({} as PrismaService);
  });

  it('should not crash when evento is null', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        paciente: null,
        terapeuta: null,
        localidade: null,
        status: { nome: 'PENDENTE' },
        usuario: null,
        baixa: false,
        updatedAt: null,
        dataEvento: null,
        evento: null,
      },
    ]);
    const count = jest.fn().mockResolvedValue(1);

    const prisma = {
      baixa: {
        findMany,
        count,
      },
    };

    (service as any).prismaService = {
      getPrismaClient: () => prisma,
    };

    const result = await service.getAll(1, 10, {} as any);

    expect(result.data[0]).toMatchObject({
      baixa: false,
      paciente: '-',
      terapeuta: '-',
      localidade: '-',
      convenio: '-',
      status: 'PENDENTE',
      usuario: '-',
      dataBaixa: '-',
      dataEvento: '-',
      cargaHoraria: '-',
      especialidade: '-',
    });
  });
});
