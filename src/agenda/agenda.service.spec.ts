import * as moment from 'moment';
import { AgendaService } from './agenda.service';

describe('AgendaService.formatEvents', () => {
  let service: AgendaService;

  beforeEach(() => {
    service = new AgendaService(
      {} as any,
      {
        getUser: jest.fn().mockResolvedValue({ id: 1 }),
      } as any,
      {
        formatLocalidade: jest.fn().mockReturnValue('Localidade'),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should not crash when recurrence metadata is missing', async () => {
    const eventos = [
      {
        id: 1,
        groupId: 'group-1',
        dataInicio: '2026-07-01',
        dataFim: null,
        start: '09:00',
        end: '10:00',
        diasFrequencia: '1',
        exdate: null,
        isExterno: false,
        isChildren: false,
        usuarioId: 1,
        km: '0',
        observacao: '',
        paciente: { id: 10, nome: 'Paciente Teste' },
        modalidade: { id: 1, nome: 'Individual' },
        especialidade: { id: 1, nome: 'Fisioterapia', cor: '#3b82f6' },
        terapeuta: { usuario: { id: 2, nome: 'Terapeuta Teste' } },
        funcao: { id: 1, nome: 'Função' },
        localidade: { id: 1, nome: 'Local' },
        statusEventos: { id: 1, nome: 'Pago' },
        frequencia: null,
        intervalo: null,
      },
    ];

    await expect(
      service.formatEvents(eventos as any, 'login'),
    ).resolves.toEqual(expect.any(Array));
  });

  it('should not crash when locality is missing', async () => {
    const eventos = [
      {
        id: 2,
        groupId: 'group-2',
        dataInicio: '2026-07-02',
        dataFim: null,
        start: '10:00',
        end: '11:00',
        diasFrequencia: '1',
        exdate: null,
        isExterno: false,
        isChildren: false,
        usuarioId: 1,
        km: '0',
        observacao: '',
        paciente: { id: 11, nome: 'Outro Paciente' },
        modalidade: { id: 1, nome: 'Individual' },
        especialidade: { id: 1, nome: 'Fisioterapia', cor: '#3b82f6' },
        terapeuta: { usuario: { id: 2, nome: 'Terapeuta Teste' } },
        funcao: { id: 1, nome: 'Função' },
        localidade: null,
        statusEventos: { id: 1, nome: 'Pago' },
        frequencia: { id: 1, nome: 'Único' },
        intervalo: { id: 1, nome: 'Semanal' },
      },
    ];

    await expect(
      service.formatEvents(eventos as any, 'login'),
    ).resolves.toEqual(expect.any(Array));
  });
});

describe('AgendaService validations', () => {
  const buildService = (prismaOverrides: any = {}) => {
    const prisma = {
      terapeuta: { findUnique: jest.fn() },
      funcao: { findUnique: jest.fn() },
      paciente: { findUnique: jest.fn() },
      statusEventos: { findUnique: jest.fn(), findFirst: jest.fn() },
      localidade: { findUnique: jest.fn() },
      calendario: { findMany: jest.fn().mockResolvedValue([]) },
      ...prismaOverrides,
    };

    const service = new AgendaService(
      { getPrismaClient: () => prisma } as any,
      { getUser: jest.fn().mockResolvedValue({ id: 1 }) } as any,
      { formatLocalidade: jest.fn().mockReturnValue('Localidade') } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    return { service, prisma };
  };

  describe('hasScheduleConflict', () => {
    const existente = {
      groupId: 'existing',
      dataInicio: '2026-08-10',
      dataFim: '2026-08-10',
      start: '09:00',
      end: '10:00',
      diasFrequencia: '',
      frequenciaId: 1,
      intervaloId: 1,
      exdate: null,
      statusEventos: { nome: 'Confirmado' },
    };

    it('rejeita sobreposição parcial (09:00-10:00 x 09:30-10:30)', async () => {
      const { service } = buildService({
        calendario: { findMany: jest.fn().mockResolvedValue([existente]) },
      });

      const conflito = await (service as any).hasScheduleConflict({
        terapeutaId: 1,
        dataInicio: '2026-08-10',
        dataFim: '2026-08-10',
        start: '09:30',
        end: '10:30',
        diasFrequencia: '',
        frequenciaId: 1,
        intervaloId: 1,
      });

      expect(conflito?.groupId).toBe('existing');
    });

    it('rejeita mesmo horário exato (09:00-10:00 x 09:00-10:00)', async () => {
      const { service } = buildService({
        calendario: { findMany: jest.fn().mockResolvedValue([existente]) },
      });

      const conflito = await (service as any).hasScheduleConflict({
        terapeutaId: 1,
        dataInicio: '2026-08-10',
        dataFim: '2026-08-10',
        start: '09:00',
        end: '10:00',
        diasFrequencia: '',
        frequenciaId: 1,
        intervaloId: 1,
      });

      expect(conflito?.groupId).toBe('existing');
    });

    it('aceita horários encostados sem sobrepor (09:00-10:00 x 10:00-11:00)', async () => {
      const { service } = buildService({
        calendario: { findMany: jest.fn().mockResolvedValue([existente]) },
      });

      const conflito = await (service as any).hasScheduleConflict({
        terapeutaId: 1,
        dataInicio: '2026-08-10',
        dataFim: '2026-08-10',
        start: '10:00',
        end: '11:00',
        diasFrequencia: '',
        frequenciaId: 1,
        intervaloId: 1,
      });

      expect(conflito).toBeNull();
    });

    it('ignora eventos cancelados na checagem de conflito', async () => {
      const { service } = buildService({
        calendario: {
          findMany: jest.fn().mockResolvedValue([
            { ...existente, statusEventos: { nome: 'Cancelado com Antecedência' } },
          ]),
        },
      });

      const conflito = await (service as any).hasScheduleConflict({
        terapeutaId: 1,
        dataInicio: '2026-08-10',
        dataFim: '2026-08-10',
        start: '09:30',
        end: '10:30',
        diasFrequencia: '',
        frequenciaId: 1,
        intervaloId: 1,
      });

      expect(conflito).toBeNull();
    });
  });

  describe('validateJornada', () => {
    const segundaFeira = moment().day(1).format('YYYY-MM-DD');

    it('rejeita horário fora de 08:00-20:00', async () => {
      const { service } = buildService();

      await expect(
        (service as any).validateJornada({
          terapeutaId: 1,
          dataInicio: segundaFeira,
          start: '19:30',
          end: '21:00',
          diasFrequencia: '',
          frequenciaId: 1,
        }),
      ).rejects.toThrow('08:00 e 20:00');
    });

    it('rejeita horário inicial maior ou igual ao final', async () => {
      const { service } = buildService();

      await expect(
        (service as any).validateJornada({
          terapeutaId: 1,
          dataInicio: segundaFeira,
          start: '10:00',
          end: '09:00',
          diasFrequencia: '',
          frequenciaId: 1,
        }),
      ).rejects.toThrow('horário inicial deve ser menor');
    });

    it('rejeita quando a terapeuta não tem jornada cadastrada no dia', async () => {
      const { service } = buildService({
        terapeuta: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ cargaHoraria: JSON.stringify({}) }),
        },
      });

      await expect(
        (service as any).validateJornada({
          terapeutaId: 1,
          dataInicio: segundaFeira,
          start: '09:00',
          end: '10:00',
          diasFrequencia: '',
          frequenciaId: 1,
        }),
      ).rejects.toThrow('jornada cadastrada');
    });

    it('aceita horário dentro da jornada cadastrada', async () => {
      const { service } = buildService({
        terapeuta: {
          findUnique: jest.fn().mockResolvedValue({
            cargaHoraria: JSON.stringify({ 'Segunda-feira': { '09:00': true } }),
          }),
        },
      });

      await expect(
        (service as any).validateJornada({
          terapeutaId: 1,
          dataInicio: segundaFeira,
          start: '09:00',
          end: '10:00',
          diasFrequencia: '',
          frequenciaId: 1,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('isEventoPassado / assertSomenteStatusAlterado', () => {
    it('considera passado quando data+horário final já ficaram para trás', () => {
      const { service } = buildService();
      const ontem = moment().subtract(1, 'day').format('YYYY-MM-DD');

      expect((service as any).isEventoPassado(ontem, '10:00')).toBe(true);
    });

    it('não considera passado um evento futuro', () => {
      const { service } = buildService();
      const amanha = moment().add(1, 'day').format('YYYY-MM-DD');

      expect((service as any).isEventoPassado(amanha, '10:00')).toBe(false);
    });

    it('não considera passado dentro da tolerância de 2h após o término (check-in mobile)', () => {
      const { service } = buildService();
      const fimHaUmaHora = moment().subtract(1, 'hour');

      expect(
        (service as any).isEventoPassado(
          fimHaUmaHora.format('YYYY-MM-DD'),
          fimHaUmaHora.format('HH:mm'),
        ),
      ).toBe(false);
    });

    it('considera passado depois de 2h do término', () => {
      const { service } = buildService();
      const fimHa3Horas = moment().subtract(3, 'hours');

      expect(
        (service as any).isEventoPassado(
          fimHa3Horas.format('YYYY-MM-DD'),
          fimHa3Horas.format('HH:mm'),
        ),
      ).toBe(true);
    });

    it('rejeita alteração de campo diferente de status em evento passado', () => {
      const { service } = buildService();

      expect(() =>
        (service as any).assertSomenteStatusAlterado(
          { pacienteId: 2, especialidadeId: 1, terapeutaId: 1, funcaoId: 1, localidadeId: 1, observacao: '' },
          { pacienteId: 1, especialidadeId: 1, terapeutaId: 1, funcaoId: 1, localidadeId: 1, observacao: '' },
        ),
      ).toThrow('apenas o status');
    });

    it('permite quando só o status muda em evento passado', () => {
      const { service } = buildService();

      expect(() =>
        (service as any).assertSomenteStatusAlterado(
          { pacienteId: 1, especialidadeId: 1, terapeutaId: 1, funcaoId: 1, localidadeId: 1, observacao: 'x', statusEventosId: 9 },
          { pacienteId: 1, especialidadeId: 1, terapeutaId: 1, funcaoId: 1, localidadeId: 1, observacao: 'x', statusEventosId: 3 },
        ),
      ).not.toThrow();
    });
  });

  describe('assertStatusPermitidoParaEventoPassado', () => {
    it('rejeita qualquer status diferente de Atestado em evento passado', async () => {
      const { service } = buildService({
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({ nome: 'Atendido' }),
          findFirst: jest.fn(),
        },
      });

      await expect(
        (service as any).assertStatusPermitidoParaEventoPassado(1),
      ).rejects.toThrow('Atestado');
    });

    it('aceita quando o status resolvido é Atestado', async () => {
      const { service } = buildService({
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({ nome: 'Atestado' }),
          findFirst: jest.fn(),
        },
      });

      await expect(
        (service as any).assertStatusPermitidoParaEventoPassado(1),
      ).resolves.toBeUndefined();
    });
  });

  describe('resolveStatusCancelamento', () => {
    it('não mexe em status que não seja de cancelamento com/sem antecedência', async () => {
      const { service } = buildService({
        statusEventos: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 5, nome: 'Atendido', cobrar: true }),
          findFirst: jest.fn(),
        },
      });

      const resolved = await (service as any).resolveStatusCancelamento(
        5,
        '2026-08-10',
        '09:00',
      );

      expect(resolved).toEqual({ id: 5, nome: 'Atendido', cobrar: true });
    });

    it('resolve para "sem antecedência" quando falta menos de 48h', async () => {
      const emUmaHora = moment().add(1, 'hour');

      const { service } = buildService({
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({
            id: 10,
            nome: 'Cancelado com Antecedência',
            cobrar: false,
          }),
          findFirst: jest.fn().mockResolvedValue({
            id: 11,
            nome: 'Cancelado sem Antecedência',
            cobrar: true,
          }),
        },
      });

      const resolved = await (service as any).resolveStatusCancelamento(
        10,
        emUmaHora.format('YYYY-MM-DD'),
        emUmaHora.format('HH:mm'),
      );

      expect(resolved.id).toBe(11);
      expect(resolved.cobrar).toBe(true);
    });

    it('resolve para "com antecedência" quando faltam 48h ou mais', async () => {
      const em3Dias = moment().add(3, 'days');

      const { service } = buildService({
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({
            id: 10,
            nome: 'Cancelado sem Antecedência',
            cobrar: true,
          }),
          findFirst: jest.fn().mockResolvedValue({
            id: 12,
            nome: 'Cancelado com Antecedência',
            cobrar: false,
          }),
        },
      });

      const resolved = await (service as any).resolveStatusCancelamento(
        10,
        em3Dias.format('YYYY-MM-DD'),
        em3Dias.format('HH:mm'),
      );

      expect(resolved.id).toBe(12);
      expect(resolved.cobrar).toBe(false);
    });
  });
});
