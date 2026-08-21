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

  it('normaliza ticketId (filtro de Baixa por chamado de origem)', () => {
    const filter = buildQueryFilter({ ticketId: '3' });

    expect(filter).toEqual({ ticketId: 3 });
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

  describe('update', () => {
    it('confirma a baixa (baixa=true + usuarioId do login) quando o corpo não traz ticketId', async () => {
      const update = jest.fn().mockResolvedValue({ id: 1, baixa: true });
      const prisma = { baixa: { update } };

      (service as any).prismaService = { getPrismaClient: () => prisma };
      (service as any).userService = {
        getUser: jest.fn().mockResolvedValue({ id: 42 }),
      };

      await service.update({ id: 1 } as any, 'login');

      expect(update).toHaveBeenCalledWith({
        data: { baixa: true, usuarioId: 42 },
        where: { id: 1 },
      });
    });

    it('só atualiza o ticket (sem tocar em baixa/usuarioId) quando ticketId vem no corpo', async () => {
      const update = jest.fn().mockResolvedValue({ id: 1, ticketId: 5 });
      const prisma = { baixa: { update } };
      const getUser = jest.fn();

      (service as any).prismaService = { getPrismaClient: () => prisma };
      (service as any).userService = { getUser };

      await service.update({ id: 1, ticketId: 5 } as any, 'login');

      expect(update).toHaveBeenCalledWith({
        data: { ticketId: 5 },
        where: { id: 1 },
      });
      expect(getUser).not.toHaveBeenCalled();
    });

    it('limpa o vínculo do ticket quando ticketId vem null', async () => {
      const update = jest.fn().mockResolvedValue({ id: 1, ticketId: null });
      const prisma = { baixa: { update } };

      (service as any).prismaService = { getPrismaClient: () => prisma };
      (service as any).userService = { getUser: jest.fn() };

      await service.update({ id: 1, ticketId: null } as any, 'login');

      expect(update).toHaveBeenCalledWith({
        data: { ticketId: null },
        where: { id: 1 },
      });
    });
  });

  describe('create', () => {
    it('não cria baixa duplicada e sinaliza claramente em vez de falhar em silêncio', async () => {
      const findMany = jest.fn().mockResolvedValue([{ id: 5, eventoId: 42 }]);
      const create = jest.fn();

      (service as any).prismaService = {
        getPrismaClient: () => ({ baixa: { findMany, create } }),
      };

      const result = await service.create({
        pacienteId: 1,
        terapeutaId: 1,
        localidadeId: 1,
        statusEventosId: 1,
        eventoId: 42,
        dataEvento: '2026-08-05',
      });

      expect(create).not.toHaveBeenCalled();
      expect(result).toMatchObject({ created: false, duplicate: true });
    });

    it('cria a baixa normalmente quando não existe uma para o evento', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const create = jest.fn().mockResolvedValue({ id: 9, eventoId: 42 });

      (service as any).prismaService = {
        getPrismaClient: () => ({ baixa: { findMany, create } }),
      };

      const result = await service.create({
        pacienteId: 1,
        terapeutaId: 1,
        localidadeId: 1,
        statusEventosId: 1,
        eventoId: 42,
        dataEvento: '2026-08-05',
      });

      expect(create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ created: true, duplicate: false });
    });
  });

  describe('delete', () => {
    const buildPrisma = (baixaExistente: any = { id: 7, eventoId: 42 }) => {
      const baixaExclusaoLogCreate = { data: undefined };
      const prisma = {
        baixa: {
          findUnique: jest.fn().mockResolvedValue(baixaExistente),
          delete: jest.fn().mockResolvedValue(baixaExistente),
        },
        baixaExclusaoLog: {
          create: jest.fn((args: any) => {
            baixaExclusaoLogCreate.data = args.data;
            return args.data;
          }),
        },
        $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
      };

      return { prisma, baixaExclusaoLogCreate };
    };

    it('rejeita exclusão sem motivo', async () => {
      const { prisma } = buildPrisma();
      (service as any).prismaService = { getPrismaClient: () => prisma };
      (service as any).userService = { getUser: jest.fn() };

      await expect(service.delete(7, '', 'alguem')).rejects.toThrow(/[Mm]otivo/);
      expect(prisma.baixa.delete).not.toHaveBeenCalled();
    });

    it('rejeita quando a baixa não existe mais', async () => {
      const { prisma } = buildPrisma(null);
      (service as any).prismaService = { getPrismaClient: () => prisma };
      (service as any).userService = { getUser: jest.fn() };

      await expect(
        service.delete(999, 'duplicada por engano', 'alguem'),
      ).rejects.toThrow(/não encontrada/);
    });

    it('grava snapshot + motivo + usuário no log antes de excluir fisicamente', async () => {
      const { prisma } = buildPrisma({ id: 7, eventoId: 42, baixa: true });
      (service as any).prismaService = { getPrismaClient: () => prisma };
      (service as any).userService = {
        getUser: jest.fn().mockResolvedValue({ id: 3, login: 'admin.user' }),
      };

      await service.delete(7, 'baixa lançada errada', 'admin.user');

      expect(prisma.baixaExclusaoLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            baixaId: 7,
            motivo: 'baixa lançada errada',
            usuarioId: 3,
            snapshot: expect.objectContaining({ id: 7, eventoId: 42 }),
          }),
        }),
      );
      expect(prisma.baixa.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });
});
