import * as moment from 'moment';
import { AgendaService } from './agenda.service';

// Usado nos vários pontos que instanciam AgendaService diretamente (sem
// Nest DI) — historicoService é o 7º argumento do construtor desde que
// criação/edição/exclusão de evento passaram a gerar histórico.
const buildHistoricoMock = () => ({
  registrarCriacao: jest.fn().mockResolvedValue(undefined),
  registrarEdicao: jest.fn().mockResolvedValue(undefined),
  registrarExclusao: jest.fn().mockResolvedValue(undefined),
});

describe('AgendaService.getCalendarioSelect — convenio em /evento/filtro', () => {
  it('inclui convenio (id/nome) dentro do select de paciente', () => {
    const service: any = new AgendaService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      buildHistoricoMock() as any,
    );

    const select = service.getCalendarioSelect();

    expect(select.paciente.select.convenio).toEqual({
      select: { id: true, nome: true },
    });
  });
});

describe('AgendaService.formatEvents', () => {
  let service: AgendaService;

  beforeEach(() => {
    service = new AgendaService(
      {
        getPrismaClient: () => ({
          sessao: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      } as any,
      {
        getUser: jest.fn().mockResolvedValue({ id: 1 }),
      } as any,
      {
        formatLocalidade: jest.fn().mockReturnValue('Localidade'),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      buildHistoricoMock() as any,
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
      buildHistoricoMock() as any,
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
            {
              ...existente,
              statusEventos: { nome: 'Cancelado com Antecedência' },
            },
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
            cargaHoraria: JSON.stringify({
              'Segunda-feira': { '09:00': true },
            }),
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
          {
            pacienteId: 2,
            especialidadeId: 1,
            terapeutaId: 1,
            funcaoId: 1,
            localidadeId: 1,
            observacao: '',
          },
          {
            pacienteId: 1,
            especialidadeId: 1,
            terapeutaId: 1,
            funcaoId: 1,
            localidadeId: 1,
            observacao: '',
          },
        ),
      ).toThrow('apenas o status');
    });

    it('permite quando só o status muda em evento passado', () => {
      const { service } = buildService();

      expect(() =>
        (service as any).assertSomenteStatusAlterado(
          {
            pacienteId: 1,
            especialidadeId: 1,
            terapeutaId: 1,
            funcaoId: 1,
            localidadeId: 1,
            observacao: 'x',
            statusEventosId: 9,
          },
          {
            pacienteId: 1,
            especialidadeId: 1,
            terapeutaId: 1,
            funcaoId: 1,
            localidadeId: 1,
            observacao: 'x',
            statusEventosId: 3,
          },
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

  describe('computeFinanceiroSnapshot (R17)', () => {
    it('busca valor da especialidade (via vaga do paciente) e comissão da função (via terapeuta), e inclui as tarifas de km/devolutiva vigentes', async () => {
      const { service } = buildService({
        vaga: {
          findUnique: jest.fn().mockResolvedValue({ id: 55 }),
        },
        vagaOnEspecialidade: {
          findUnique: jest.fn().mockResolvedValue({ valor: '150.00' }),
        },
        terapeutaOnFuncao: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ comissao: '80.00', tipo: 'Fixo' }),
        },
      });

      const snapshot = await (service as any).computeFinanceiroSnapshot({
        pacienteId: 1,
        especialidadeId: 2,
        terapeutaId: 3,
        funcaoId: 4,
      });

      expect(snapshot).toEqual({
        valorSessaoSnapshot: '150.00',
        comissaoSnapshot: '80.00',
        tipoComissaoSnapshot: 'Fixo',
        valorPorKmSnapshot: expect.any(Number),
        valorSessaoDevolutivaSnapshot: expect.any(Number),
      });
    });

    it('devolve valores null quando paciente não tem vaga ou terapeuta não tem a função — não quebra', async () => {
      const { service } = buildService({
        vaga: { findUnique: jest.fn().mockResolvedValue(null) },
        terapeutaOnFuncao: { findUnique: jest.fn().mockResolvedValue(null) },
      });

      const snapshot = await (service as any).computeFinanceiroSnapshot({
        pacienteId: 1,
        especialidadeId: 2,
        terapeutaId: 3,
        funcaoId: 4,
      });

      expect(snapshot.valorSessaoSnapshot).toBeNull();
      expect(snapshot.comissaoSnapshot).toBeNull();
      expect(snapshot.tipoComissaoSnapshot).toBeNull();
    });
  });

  describe('delete — bloqueio de série com sessão já realizada (R11)', () => {
    const eventoBase = {
      paciente: {
        id: 1,
        statusPacienteCod: 'therapy',
        vaga: { id: 5, especialidades: [] },
      },
      especialidadeId: 1,
      groupId: 'serie-1',
      dataInicio: moment().add(5, 'days').format('YYYY-MM-DD'),
      end: '11:00',
    };

    const buildDeleteService = (ocorrencias: any[]) => {
      const prisma = {
        calendario: {
          findFirstOrThrow: jest.fn().mockResolvedValue(eventoBase),
          findMany: jest.fn().mockResolvedValue(ocorrencias),
          deleteMany: jest.fn().mockResolvedValue({ count: ocorrencias.length }),
        },
        vaga: { update: jest.fn().mockResolvedValue({}) },
      };

      const service = new AgendaService(
        { getPrismaClient: () => prisma } as any,
        { getUser: jest.fn().mockResolvedValue({ id: 1 }) } as any,
        {} as any,
        {} as any,
        { update: jest.fn().mockResolvedValue(undefined) } as any,
        {} as any,
        buildHistoricoMock() as any,
      );

      return { service, prisma };
    };

    it('bloqueia excluir a série quando alguma ocorrência (mesmo de outra linha da série) já passou', async () => {
      const { service, prisma } = buildDeleteService([
        // ocorrência futura (a apontada por eventId)
        { dataInicio: eventoBase.dataInicio, end: '11:00' },
        // outra linha da mesma série (split isChildren), já passada
        {
          dataInicio: moment().subtract(10, 'days').format('YYYY-MM-DD'),
          end: '11:00',
        },
      ]);

      await expect(service.delete(1, 'usuario.login')).rejects.toThrow(
        /já realizada/,
      );
      expect(prisma.calendario.deleteMany).not.toHaveBeenCalled();
    });

    it('permite excluir quando toda a série ainda é futura', async () => {
      const { service, prisma } = buildDeleteService([
        { dataInicio: eventoBase.dataInicio, end: '11:00' },
        {
          dataInicio: moment().add(12, 'days').format('YYYY-MM-DD'),
          end: '11:00',
        },
      ]);

      await service.delete(1, 'usuario.login');

      expect(prisma.calendario.deleteMany).toHaveBeenCalledWith({
        where: { groupId: 'serie-1', usuarioId: 1 },
      });
    });
  });
});

describe('AgendaService.expandRecurringOccurrences (item 5 — heron-list-web)', () => {
  const buildService = () =>
    new AgendaService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      buildHistoricoMock() as any,
    );

  it('devolve evento único sem alteração (não tem rrule)', () => {
    const service: any = buildService();
    const item = { id: 1, date: '2026-08-20', start: '2026-08-20 09:00', end: '2026-08-20 10:00' };

    const result = service.expandRecurringOccurrences([item], '2026-08-17', '2026-08-23');

    expect(result).toEqual([item]);
  });

  it('expande série semanal (todas as semanas) nos dias configurados dentro do range', () => {
    const service: any = buildService();
    // Série toda segunda e quarta, começando numa segunda, sem dataFim.
    const item = {
      id: 10,
      groupId: 'serie-1',
      dataInicio: '2026-08-17', // segunda-feira
      dataFim: '',
      start: '09:00',
      end: '10:00',
      exdate: [],
      daysOfWeek: [1, 3], // segunda, quarta (convenção 0=domingo)
      rrule: { freq: 'weekly', dtstart: '2026-08-17 09:00' },
    };

    // Range cobre 2 semanas completas.
    const result = service.expandRecurringOccurrences(
      [item],
      '2026-08-17',
      '2026-08-30',
    );

    const datas = result.map((r: any) => r.date);
    expect(datas).toEqual(['2026-08-17', '2026-08-19', '2026-08-24', '2026-08-26']);
    expect(result[0].rrule).toBeUndefined();
    expect(result[0].daysOfWeek).toBeUndefined();
    expect(result[0].start).toBe('2026-08-17 09:00');
    expect(result[0].end).toBe('2026-08-17 10:00');
  });

  it('respeita o interval (a cada N semanas), ancorado na semana de dataInicio', () => {
    const service: any = buildService();
    // A cada 2 semanas, toda sexta.
    const item = {
      id: 11,
      dataInicio: '2026-08-14', // sexta-feira
      dataFim: '',
      start: '14:00',
      end: '15:00',
      exdate: [],
      rrule: { freq: 'weekly', interval: 2, byweekday: [5], dtstart: '2026-08-14 14:00' },
    };

    // 5 semanas de range: só semanas 0, 2, 4 (a partir da semana de 14/08) devem aparecer.
    const result = service.expandRecurringOccurrences(
      [item],
      '2026-08-14',
      '2026-09-18',
    );

    const datas = result.map((r: any) => r.date);
    expect(datas).toEqual(['2026-08-14', '2026-08-28', '2026-09-11']);
  });

  it('exclui datas em exdate e respeita dataFim', () => {
    const service: any = buildService();
    const item = {
      id: 12,
      dataInicio: '2026-08-17', // segunda
      dataFim: '2026-08-31',
      start: '09:00',
      end: '10:00',
      exdate: ['2026-08-24 09:00'], // pula a segunda seguinte
      daysOfWeek: [1],
      rrule: { freq: 'weekly', dtstart: '2026-08-17 09:00' },
    };

    const result = service.expandRecurringOccurrences(
      [item],
      '2026-08-01',
      '2026-09-30',
    );

    const datas = result.map((r: any) => r.date);
    // 17/08 (ok), 24/08 (excluído), 31/08 (última segunda dentro de dataFim)
    expect(datas).toEqual(['2026-08-17', '2026-08-31']);
  });

  it('não gera ocorrência quando a série não cruza o range pedido', () => {
    const service: any = buildService();
    const item = {
      id: 13,
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
      start: '09:00',
      end: '10:00',
      exdate: [],
      daysOfWeek: [1],
      rrule: { freq: 'weekly', dtstart: '2026-01-01 09:00' },
    };

    const result = service.expandRecurringOccurrences(
      [item],
      '2026-08-01',
      '2026-08-31',
    );

    expect(result).toEqual([]);
  });
});

describe('AgendaService.applyPermissionFlags (item 3 — heron-list-web)', () => {
  const buildService = (perfilNome: string) =>
    new AgendaService(
      {} as any,
      { getUser: jest.fn().mockResolvedValue({ perfil: { nome: perfilNome } }) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      buildHistoricoMock() as any,
    );

  const futuro = moment().add(3, 'days').format('YYYY-MM-DD');
  const passado = moment().subtract(3, 'days').format('YYYY-MM-DD');

  it('Terapeuta pode marcar Atendido num evento futuro não atendido', async () => {
    const service: any = buildService('Terapeuta');

    const [item] = await service.applyPermissionFlags(
      [{ date: futuro, statusEventos: { nome: 'Confirmado' }, paciente: { nome: 'Fulano' } }],
      'login',
    );

    expect(item.podeMarcarAtendido).toBe(true);
    expect(item.podeMarcarAtestado).toBe(false);
    expect(item.isAttended).toBe(false);
    expect(item.vago).toBe(false);
  });

  it('Secretária pode marcar Atestado num evento passado ainda sem status final', async () => {
    const service: any = buildService('Secretária');

    const [item] = await service.applyPermissionFlags(
      [{ date: passado, statusEventos: { nome: 'Confirmado' }, paciente: { nome: 'Fulano' } }],
      'login',
    );

    expect(item.podeMarcarAtestado).toBe(true);
    expect(item.podeMarcarAtendido).toBe(false); // Secretária não marca Atendido
  });

  it('Terapeuta NÃO pode marcar Atendido num evento já passado', async () => {
    const service: any = buildService('Terapeuta');

    const [item] = await service.applyPermissionFlags(
      [{ date: passado, statusEventos: { nome: 'Confirmado' }, paciente: { nome: 'Fulano' } }],
      'login',
    );

    expect(item.podeMarcarAtendido).toBe(false);
  });

  it('vaga livre (paciente "Livre") nunca libera nenhuma das duas ações', async () => {
    const service: any = buildService('Terapeuta');

    const [item] = await service.applyPermissionFlags(
      [{ date: futuro, statusEventos: { nome: 'Confirmado' }, paciente: { nome: 'Livre' } }],
      'login',
    );

    expect(item.vago).toBe(true);
    expect(item.podeMarcarAtendido).toBe(false);
  });

  it('isCanceled reconhece qualquer status "Cancelado *" (não exige match exato)', async () => {
    const service: any = buildService('Developer');

    const [item] = await service.applyPermissionFlags(
      [{ date: futuro, statusEventos: { nome: 'Cancelado s/ Antecedência' }, paciente: { nome: 'Fulano' } }],
      'login',
    );

    expect(item.isCanceled).toBe(true);
  });

  it('Administrador/perfil sem permissão específica não marca nem Atendido nem Atestado', async () => {
    const service: any = buildService('Administrador');

    const [item] = await service.applyPermissionFlags(
      [{ date: futuro, statusEventos: { nome: 'Confirmado' }, paciente: { nome: 'Fulano' } }],
      'login',
    );

    expect(item.podeMarcarAtendido).toBe(false);
    expect(item.podeMarcarAtestado).toBe(false);
  });
});

describe('AgendaService — resumo de sessão automático (RESUMO DE SESSÃO)', () => {
  const buildService = (prisma: any) =>
    new AgendaService(
      { getPrismaClient: () => prisma } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      buildHistoricoMock() as any,
    );

  describe('statusExigeResumoAutomatico', () => {
    const service: any = buildService({});

    it('reconhece "Cancelado" e qualquer variação, sem exigir match exato', () => {
      expect(service.statusExigeResumoAutomatico('Cancelado')).toBe(true);
      expect(service.statusExigeResumoAutomatico('Cancelado c/ Antecedência')).toBe(true);
      expect(service.statusExigeResumoAutomatico('Cancelado s/ Antecedência')).toBe(true);
      expect(service.statusExigeResumoAutomatico('Cancelado Terapeuta')).toBe(true);
      expect(service.statusExigeResumoAutomatico('Cancelado Clínica')).toBe(true);
    });

    it('reconhece "Atestado" e "Falta"', () => {
      expect(service.statusExigeResumoAutomatico('Atestado')).toBe(true);
      expect(service.statusExigeResumoAutomatico('Falta')).toBe(true);
    });

    it('é case-insensitive e tolera espaços nas pontas', () => {
      expect(service.statusExigeResumoAutomatico(' ATESTADO ')).toBe(true);
      expect(service.statusExigeResumoAutomatico('falta')).toBe(true);
      expect(service.statusExigeResumoAutomatico('cancelado terapeuta')).toBe(true);
    });

    it('não marca outros status (Confirmado, Pago, Atendido)', () => {
      expect(service.statusExigeResumoAutomatico('Confirmado')).toBe(false);
      expect(service.statusExigeResumoAutomatico('Pago')).toBe(false);
      expect(service.statusExigeResumoAutomatico('Atendido')).toBe(false);
    });

    it('não quebra com nome ausente/vazio', () => {
      expect(service.statusExigeResumoAutomatico(undefined as any)).toBe(false);
      expect(service.statusExigeResumoAutomatico('')).toBe(false);
    });
  });

  describe('montarResumoAutomatico', () => {
    const service: any = buildService({});

    it('gera texto com no mínimo 200 caracteres incluindo status, data e horário', () => {
      const texto = service.montarResumoAutomatico('Falta', '2026-08-21', '14:00');

      expect(texto.length).toBeGreaterThanOrEqual(200);
      expect(texto).toContain('Falta');
      expect(texto).toContain('21/08/2026');
      expect(texto).toContain('14:00');
    });

    it('usa "-" quando data/horário não vêm preenchidos', () => {
      const texto = service.montarResumoAutomatico('Atestado', '', '');

      expect(texto).toContain('Atestado');
      expect(texto).toContain('-');
    });
  });

  describe('autoPreencherResumoSessao', () => {
    const evento = {
      id: 10,
      pacienteId: 5,
      dataInicio: '2026-08-21',
      start: '14:00',
      statusEventosId: 99,
    };

    it('não faz nada quando o status não exige resumo automático', async () => {
      const findMany = jest.fn();
      const prisma = {
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({ nome: 'Confirmado' }),
        },
        sessao: { findFirst: findMany, update: jest.fn(), create: jest.fn() },
      };
      const service: any = buildService(prisma);

      await service.autoPreencherResumoSessao(evento);

      expect(prisma.sessao.findFirst).not.toHaveBeenCalled();
    });

    it('cria a Sessao com o resumo automático quando não existe sessão registrada', async () => {
      const prisma = {
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({ nome: 'Falta' }),
        },
        sessao: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
      };
      const service: any = buildService(prisma);

      await service.autoPreencherResumoSessao(evento);

      expect(prisma.sessao.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          calendarioId: evento.id,
          pacienteId: evento.pacienteId,
          resumo: expect.stringContaining('Falta'),
        }),
      });
      expect(prisma.sessao.update).not.toHaveBeenCalled();
    });

    it('acrescenta ao final do resumo já existente, sem sobrescrever (pedido explícito do usuário)', async () => {
      const prisma = {
        statusEventos: {
          findUnique: jest.fn().mockResolvedValue({ nome: 'Cancelado s/ Antecedência' }),
        },
        sessao: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 7, resumo: 'Evolução real já escrita pelo terapeuta.' }),
          update: jest.fn().mockResolvedValue({}),
          create: jest.fn(),
        },
      };
      const service: any = buildService(prisma);

      await service.autoPreencherResumoSessao(evento);

      expect(prisma.sessao.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          resumo: expect.stringContaining('Evolução real já escrita pelo terapeuta.'),
        },
      });
      const resumoFinal = (prisma.sessao.update as jest.Mock).mock.calls[0][0].data.resumo;
      expect(resumoFinal.startsWith('Evolução real já escrita pelo terapeuta.')).toBe(true);
      expect(resumoFinal).toContain('Cancelado s/ Antecedência');
      expect(prisma.sessao.create).not.toHaveBeenCalled();
    });

    it('não lança erro quando o status não é encontrado', async () => {
      const prisma = {
        statusEventos: { findUnique: jest.fn().mockResolvedValue(null) },
        sessao: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
      };
      const service: any = buildService(prisma);

      await expect(service.autoPreencherResumoSessao(evento)).resolves.toBeUndefined();
      expect(prisma.sessao.findFirst).not.toHaveBeenCalled();
    });

    it('captura erro internamente (não propaga) se a query falhar', async () => {
      const prisma = {
        statusEventos: {
          findUnique: jest.fn().mockRejectedValue(new Error('DB fora do ar')),
        },
        sessao: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
      };
      const service: any = buildService(prisma);

      await expect(service.autoPreencherResumoSessao(evento)).resolves.toBeUndefined();
    });
  });
});
