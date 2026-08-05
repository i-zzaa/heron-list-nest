import { BaixaService } from './baixa.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { buildQueryFilter } from 'src/util/filters';

describe('BaixaService', () => {
  let service: BaixaService;

  beforeEach(() => {
    service = new BaixaService({} as PrismaService, {} as UserService);
  });

  it('should normalize boolean and nested query filters', () => {
    const filter = buildQueryFilter({
      baixa: 'false',
      convenioId: '2',
      pacienteId: '10',
    });

    expect(filter).toEqual({
      baixa: false,
      pacienteId: 10,
      paciente: {
        convenio: {
          id: 2,
        },
      },
    });
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
