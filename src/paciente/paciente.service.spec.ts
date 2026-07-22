import { PacienteService } from './paciente.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PacienteService', () => {
  let service: PacienteService;

  beforeEach(() => {
    service = new PacienteService({} as PrismaService);
  });

  it('should format patients even when vaga or especialidades are missing', async () => {
    const result = await service.formatPatients([
      {
        id: 70,
        dataNascimento: '2000-01-01',
        vaga: undefined,
      },
    ] as any);

    expect(result).toEqual([
      expect.objectContaining({
        id: 70,
        idade: expect.any(String),
        sessao: [],
      }),
    ]);
  });

  it('should omit vaga filters when no vaga criteria are provided', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1, dataNascimento: '2000-01-01' }])
      .mockResolvedValueOnce([{ id: 1 }]);

    const prismaClient = {
      paciente: {
        findMany,
      },
    };

    service = new PacienteService({
      getPrismaClient: () => prismaClient,
    } as any);

    await service.filterPatients(1, 10, ['therapy'], {
      disabled: false,
    } as any);

    expect(findMany.mock.calls[0][0].where.vaga).toBeUndefined();
  });

  it('should include therapy records when filtering by crud_therapy status', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 1, dataNascimento: '2000-01-01' }])
      .mockResolvedValueOnce([{ id: 1 }]);

    const prismaClient = {
      paciente: {
        findMany,
      },
    };

    service = new PacienteService({
      getPrismaClient: () => prismaClient,
    } as any);

    await service.filterSinglePatients(
      { statusPacienteCod: 'crud_therapy', pacientes: 79 },
      1,
      10,
    );

    expect(findMany.mock.calls[0][0].where.statusPacienteCod.in).toEqual([
      'therapy',
      'crud_therapy',
    ]);
  });

  it('should filter patients by patient id on the paciente model when pacientes is provided', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ id: 79, dataNascimento: '2000-01-01' }])
      .mockResolvedValueOnce([{ id: 79 }]);

    const prismaClient = {
      paciente: {
        findMany,
      },
    };

    service = new PacienteService({
      getPrismaClient: () => prismaClient,
    } as any);

    await service.filterPatients(1, 10, ['crud_therapy'], {
      disabled: false,
      pacientes: 79,
    } as any);

    expect(findMany.mock.calls[0][0].where.id).toEqual({ in: [79] });
  });

  it('should search patients by name, responsible or phone using the paciente model', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Paciente' }]);
    const prismaClient = {
      paciente: {
        findMany,
      },
    };

    service = new PacienteService({
      getPrismaClient: () => prismaClient,
    } as any);

    await service.search('paciente');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ nome: { contains: 'paciente' } }),
          ]),
        }),
      }),
    );
  });

  it('should resolve a vaga when updating a patient without vagaId', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const findMany = jest.fn().mockResolvedValue([]);
    const update = jest.fn().mockResolvedValue({ id: 1 });
    const findUnique = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({ id: 55 });

    const prismaClient = {
      $transaction: jest.fn().mockResolvedValue([{}, {}, []]),
      paciente: {
        update,
        findUnique,
      },
      vaga: {
        create,
      },
      vagaOnEspecialidade: {
        deleteMany,
        findMany,
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    service = new PacienteService({
      getPrismaClient: () => prismaClient,
    } as any);

    await expect(
      service.updatePatient({
        id: 1,
        nome: 'Paciente',
        telefone: '99999',
        responsavel: 'Responsavel',
        convenioId: 1,
        dataNascimento: '2000-01-01',
        tipoSessaoId: 1,
        statusId: 1,
        carteirinha: '',
        statusPacienteCod: 'therapy',
        sessao: [],
        especialidades: [2],
      } as any),
    ).resolves.toEqual([]);

    expect(create).toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ vagaId: 55 }),
      }),
    );
  });
});
