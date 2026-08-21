import { PacienteService } from './paciente.service';
import { PrismaService } from '../prisma/prisma.service';

const historicoServiceMock: any = {
  registrarCriacao: jest.fn(),
  registrarEdicao: jest.fn(),
  registrarExclusao: jest.fn(),
};

describe('PacienteService', () => {
  let service: PacienteService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PacienteService({} as PrismaService, historicoServiceMock);
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

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

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

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

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

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

    await service.filterPatients(1, 10, ['crud_therapy'], {
      disabled: false,
      pacientes: 79,
    } as any);

    expect(findMany.mock.calls[0][0].where.id).toEqual({ in: [79] });
  });

  it('should find patients with the same full name', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValue([{ id: 1, nome: 'Joao Silva' }]);
    const prismaClient = {
      paciente: {
        findMany,
      },
    };

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

    const result = await service.findByFullName('Joao Silva');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          nome: {
            equals: 'Joao Silva',
          },
        },
      }),
    );
    expect(result).toEqual([{ id: 1, nome: 'Joao Silva' }]);
  });

  it('should find patients with duplicate full names', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 2, nome: 'Joao Silva' },
      { id: 1, nome: ' joao silva ' },
      { id: 3, nome: 'Maria Souza' },
    ]);
    const prismaClient = {
      paciente: { findMany },
    };

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

    const result = await service.findDuplicateFullNames();

    expect(findMany).toHaveBeenCalled();
    // "Joao Silva" e " joao silva " são o mesmo nome (case/trim-insensitive)
    // e devem voltar juntos, ordenados por id; "Maria Souza" é única e não
    // deve aparecer.
    expect(result).toEqual([
      { id: 1, nome: ' joao silva ' },
      { id: 2, nome: 'Joao Silva' },
    ]);
  });

  it('should search patients by name, responsible or phone using the paciente model', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 1, nome: 'Paciente' }]);
    const prismaClient = {
      paciente: {
        findMany,
      },
    };

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

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

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

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

  it('should register history on create', async () => {
    const create = jest.fn().mockResolvedValue({ id: 42, nome: 'PACIENTE X' });
    const prismaClient = { paciente: { create } };

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

    await service.create({
      nome: 'Paciente X',
      responsavel: 'Resp',
      sessao: [],
    } as any);

    expect(historicoServiceMock.registrarCriacao).toHaveBeenCalledWith(
      'Paciente',
      42,
      { id: 42, nome: 'PACIENTE X' },
      undefined,
    );
  });

  it('should register a history diff on updatePatient, with only the changed fields', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      nome: 'NOME ANTIGO',
      telefone: '11111',
      responsavel: 'RESP',
      convenioId: 1,
      dataNascimento: '2000-01-01',
      tipoSessaoId: 1,
      statusId: 1,
      carteirinha: '',
      statusPacienteCod: 'therapy',
    });
    const update = jest.fn().mockResolvedValue({ id: 1 });
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    const findMany = jest.fn().mockResolvedValue([]);

    const prismaClient = {
      $transaction: jest.fn().mockResolvedValue([{}, {}, []]),
      paciente: { update, findUnique },
      vagaOnEspecialidade: {
        deleteMany,
        findMany,
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

    await service.updatePatient(
      {
        id: 1,
        vagaId: 55, // evita a segunda chamada de findUnique (resolução de vaga)
        nome: 'Nome Novo',
        telefone: '11111', // não muda
        responsavel: 'RESP',
        convenioId: 1,
        dataNascimento: '2000-01-01',
        tipoSessaoId: 1,
        statusId: 1,
        carteirinha: '',
        statusPacienteCod: 'therapy',
        sessao: [],
        especialidades: [],
      } as any,
      'coordenadora.ana',
    );

    expect(historicoServiceMock.registrarEdicao).toHaveBeenCalledWith(
      'Paciente',
      1,
      expect.objectContaining({ nome: 'NOME ANTIGO' }),
      expect.objectContaining({ nome: 'NOME NOVO' }),
      'coordenadora.ana',
    );
  });

  it('should register history as an edition (not a hard delete) when disabling a patient', async () => {
    const findUnique = jest.fn().mockResolvedValue({ disabled: false });
    const update = jest.fn().mockResolvedValue({ id: 1, disabled: true });
    const prismaClient = { paciente: { findUnique, update } };

    service = new PacienteService(
      { getPrismaClient: () => prismaClient } as any,
      historicoServiceMock,
    );

    await service.delete(1, 'coordenadora.ana');

    expect(historicoServiceMock.registrarEdicao).toHaveBeenCalledWith(
      'Paciente',
      1,
      { disabled: false },
      { disabled: true },
      'coordenadora.ana',
    );
  });
});

describe('PacienteService.aplicarAcaoDisponivel (item 8 dos pontos menores)', () => {
  const buildService = (tags: string[]) => {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          mustChangePassword: false,
          perfil: { nome: 'Secretária' },
          grupo: {
            permissoes: tags.map((cod) => ({ permissao: { cod } })),
          },
        }),
      },
    };

    return new PacienteService(
      { getPrismaClient: () => prisma } as any,
      historicoServiceMock,
    );
  };

  it('CADASTRO_PACIENTES nunca tem ação (nem busca permissão)', async () => {
    const service: any = buildService([]);

    const [item] = await service.aplicarAcaoDisponivel(
      [{ vaga: { naFila: true }, statusPacienteCod: 'crud_therapy' }],
      'CADASTRO_PACIENTES',
      'login-a',
    );

    expect(item.acaoDisponivel).toBeNull();
  });

  it('FILA_AVALIACAO: paciente na fila com a tag de agendar -> agendar', async () => {
    const service: any = buildService(['FILA_AVALIACAO_LISTA_BOTAO_AGENDAR']);

    const [item] = await service.aplicarAcaoDisponivel(
      [{ vaga: { naFila: true }, statusPacienteCod: 'queue_avaliation' }],
      'FILA_AVALIACAO',
      'login-b',
    );

    expect(item.acaoDisponivel).toBe('agendar');
  });

  it('sem a tag de agendar, mesmo na fila, não libera ação nenhuma', async () => {
    const service: any = buildService([]);

    const [item] = await service.aplicarAcaoDisponivel(
      [{ vaga: { naFila: true }, statusPacienteCod: 'queue_avaliation' }],
      'FILA_AVALIACAO',
      'login-c',
    );

    expect(item.acaoDisponivel).toBeNull();
  });

  it('FILA_DEVOLUTIVA: fora da fila com a tag de retornar -> retornar', async () => {
    const service: any = buildService([
      'FILA_DEVOLUTIVA_LISTA_BOTAO_RETORNAR_AGENDAR',
    ]);

    const [item] = await service.aplicarAcaoDisponivel(
      [{ vaga: { naFila: false }, statusPacienteCod: 'devolutiva' }],
      'FILA_DEVOLUTIVA',
      'login-d',
    );

    expect(item.acaoDisponivel).toBe('retornar');
  });

  it('FILA_DEVOLUTIVA: status queue_devolutiva -> devolutiva (sem depender de tag)', async () => {
    const service: any = buildService([]);

    const [item] = await service.aplicarAcaoDisponivel(
      [{ vaga: { naFila: true }, statusPacienteCod: 'queue_devolutiva' }],
      'FILA_DEVOLUTIVA',
      'login-e',
    );

    expect(item.acaoDisponivel).toBe('devolutiva');
  });
});
