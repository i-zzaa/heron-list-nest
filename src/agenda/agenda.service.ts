import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { LocalidadeService } from 'src/localidade/localidade.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import {
  HOURS,
  dateAddtDay,
  dateFormatYYYYMMDD,
  dateSubtractDay,
  formatDateTime,
  getDates,
  getDatesWhiteEvents,
  getPrimeiroDoMes,
  transformStringInDate,
  weekDay,
} from 'src/util/format-date';
import { CalendarioCreateParam, ObjProps } from './agenda.interface';
import { FrequenciaService } from 'src/frequencia/frequencia.service';
import { FREQUENCIA } from 'src/frequencia/frequencia.interface';
import * as bcrypt from 'bcryptjs';
import { VagaService } from 'src/vaga/vaga.service';
import { BaixaService } from 'src/baixa/baixa.service';
import { STATUS_EVENTOS_ID } from 'src/status-evento/status-evento.interface';
import { getPrismaClient } from 'src/util/crud';
import { buildDateRangeWhere, buildQueryFilter } from 'src/util/filters';
import { normalizeCurrencyValue, readDecimal } from 'src/util/normalizers';
import {
  VALOR_POR_KM,
  VALOR_SESSAO_DEVOLUTIVA,
} from 'src/util/financeiro-config';
import { PERFIL } from 'src/util/util';
import { HistoricoService } from 'src/historico/historico.service';

// Antecedência mínima, em horas, para um cancelamento não ser cobrado.
// Definido com o negócio: 48 horas corridas antes do horário de início do evento.
const ANTECEDENCIA_CANCELAMENTO_HORAS = 48;

// Teto de geração de ocorrências para série recorrente sem dataFim definida
// (paciente ainda em atendimento). Usado só para checagem de conflito/
// disponibilidade — nunca para materializar/retornar a série inteira.
const HORIZONTE_RECORRENCIA_SEM_FIM_DIAS = 365;

// Tolerância, em horas, após o horário final do evento durante a qual ele
// ainda NÃO é considerado "passado" — permite, por exemplo, o check-in
// mobile (marcar Atendido) logo depois do fim da sessão. Definido com o
// negócio: 2 horas. Depois desse prazo, só é possível alterar o status para
// Atestado (ver assertStatusPermitidoParaEventoPassado).
const TOLERANCIA_EVENTO_PASSADO_HORAS = 2;

@Injectable()
export class AgendaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly localidadadeService: LocalidadeService,
    private readonly frequenciaService: FrequenciaService,
    private readonly vagaService: VagaService,
    private readonly baixaService: BaixaService,
    private readonly historicoService: HistoricoService,
  ) {}

  private buildQueryFilter(query: Record<string, any> = {}) {
    return buildQueryFilter(query);
  }

  private getCalendarioSelect(
    options: {
      includeCobrar?: boolean;
      includeUsuarioId?: boolean;
      includeIsChildren?: boolean;
    } = {},
  ) {
    const {
      includeCobrar = false,
      includeUsuarioId = true,
      includeIsChildren = true,
    } = options;

    const statusEventosSelect = {
      select: {
        nome: true,
        id: true,
        codigo: true,
        cor: true,
        atender: true,
        ...(includeCobrar ? { cobrar: true } : {}),
      },
    };

    return {
      id: true,
      groupId: true,
      dataInicio: true,
      dataFim: true,
      start: true,
      end: true,
      diasFrequencia: true,
      exdate: true,
      isExterno: true,
      localExternoDescricao: true,
      ...(includeIsChildren ? { isChildren: true } : {}),
      ...(includeUsuarioId ? { usuarioId: true } : {}),
      km: true,
      ciclo: true,
      observacao: true,
      paciente: {
        select: {
          nome: true,
          id: true,
        },
      },
      modalidade: {
        select: {
          nome: true,
          id: true,
        },
      },
      especialidade: true,
      terapeuta: {
        select: {
          usuario: {
            select: {
              nome: true,
              id: true,
            },
          },
        },
      },
      funcao: {
        select: {
          nome: true,
          id: true,
        },
      },
      localidade: true,
      statusEventos: statusEventosSelect,
      frequencia: {
        select: {
          nome: true,
          id: true,
        },
      },
      intervalo: {
        select: {
          nome: true,
          id: true,
        },
      },
    };
  }

  /**
   * Localidade só é obrigatória quando o atendimento não é externo. Quando
   * isExterno é true, não há localidade cadastrada — km (validado em
   * validateEvento) e localExternoDescricao passam a ser obrigatórios no
   * lugar dela.
   */
  private resolveLocalidadeAtendimento(body: any): {
    localidadeId: number | null;
    localExternoDescricao: string | null;
  } {
    if (body?.isExterno) {
      return {
        localidadeId: null,
        localExternoDescricao: body?.localExternoDescricao || null,
      };
    }

    return {
      localidadeId: body?.localidade?.id ?? null,
      localExternoDescricao: null,
    };
  }

  private buildCalendarioPayload({
    body,
    userId,
    frequencia,
    diasFrequencia,
    groupId,
    pacienteId,
    modalidadeId,
    especialidadeId,
    terapeutaId,
    funcaoId,
    localidadeId,
    localExternoDescricao,
    statusEventosId,
    intervaloId,
    extraData = {},
  }: {
    body: any;
    userId: number;
    frequencia: any;
    diasFrequencia: string;
    groupId: string;
    pacienteId: number;
    modalidadeId: number;
    especialidadeId: number;
    terapeutaId: number;
    funcaoId: number;
    localidadeId: number | null;
    localExternoDescricao?: string | null;
    statusEventosId: number;
    intervaloId: number;
    extraData?: Record<string, any>;
  }) {
    return {
      groupId,
      dataInicio: body.dataInicio,
      km: normalizeCurrencyValue(body?.km),
      dataFim: body.dataFim || '',
      start: body.start,
      // Item 4 dos "pontos menores" (heron-list-web): duração padrão de
      // sessão (1h) era fixada no cliente (CalendarForm.tsx, recalculada a
      // cada mudança de horário inicial). Aceita end ausente e calcula
      // aqui, na mesma conta (start + 1h) — start continua obrigatório.
      end: body.end || moment(body.start, 'HH:mm').add(1, 'hours').format('HH:mm'),
      diasFrequencia,
      ciclo: 'ativo',
      observacao: body.observacao || '',
      pacienteId,
      modalidadeId,
      especialidadeId,
      terapeutaId,
      funcaoId,
      localidadeId,
      localExternoDescricao: localExternoDescricao ?? null,
      statusEventosId,
      frequenciaId: frequencia.id,
      intervaloId,
      isExterno: !!body.isExterno,
      usuarioId: userId,
      ...extraData,
    };
  }

  /**
   * Monta o payload de gravação de um evento a partir do body recebido.
   *
   * Quando `original` (o registro atualmente salvo no banco) é informado,
   * os campos que a regra de negócio bloqueia para edição — modalidade,
   * data, horário inicial/final, frequência, intervalo e dias da semana —
   * são sempre mantidos com o valor do banco, ignorando silenciosamente
   * qualquer valor diferente enviado pelo cliente. Os demais campos
   * (paciente, especialidade, terapeuta, função, local, status,
   * observação, atendimento externo/km) continuam vindo do `event`/body.
   */
  formatEvent(event: any, original?: any) {
    let diasFrequencia = event.diasFrequencia;
    if (event?.diasFrequencia && typeof event?.diasFrequencia === 'object') {
      diasFrequencia = event?.diasFrequencia?.join();
    }

    const { localidadeId, localExternoDescricao } =
      this.resolveLocalidadeAtendimento(event);

    const data: any = {
      groupId: event?.groupId,
      km: normalizeCurrencyValue(event?.km),
      dataInicio: event?.dataInicio,
      dataFim: event?.dataFim,
      start: event?.start,
      end: event?.end,
      ciclo: event?.ciclo,
      observacao: event?.observacao,
      pacienteId: event?.paciente?.id,
      modalidadeId: event?.modalidade?.id,
      especialidadeId: event?.especialidade?.id,
      terapeutaId: event?.terapeuta?.id || event?.terapeuta?.usuarioId,
      funcaoId: event?.funcao?.id,
      localidadeId,
      localExternoDescricao,
      statusEventosId: event?.statusEventos?.id,
      diasFrequencia,
      isExterno: event?.isExterno,
      frequenciaId: event?.frequencia?.id,
      intervaloId: event?.intervalo?.id,
    };

    if (original) {
      data.dataInicio = original.dataInicio;
      data.start = original.start;
      data.end = original.end;
      data.modalidadeId = original.modalidadeId;
      data.frequenciaId = original.frequenciaId;
      data.intervaloId = original.intervaloId;
      data.diasFrequencia = original.diasFrequencia;
    }

    return data;
  }

  /**
   * Cancelamento com/sem antecedência não é uma escolha do cliente: o
   * backend decide sozinho com base em quanto falta para o horário de
   * início do evento (regra combinada com o negócio: 48 horas corridas).
   *
   * Se o status enviado for "Cancelado com Antecedência" ou "Cancelado sem
   * Antecedência", ele é silenciosamente substituído pelo status correto
   * calculado aqui. Qualquer outro status (Atendido, Falta, Cancelado pela
   * Clínica, Atestado etc.) passa direto, sem alteração — só esses dois são
   * mutuamente calculados a partir do prazo.
   */
  /**
   * Um evento é "passado" quando já se passaram mais de
   * TOLERANCIA_EVENTO_PASSADO_HORAS (2h) desde o horário final (data + end).
   * A tolerância existe para não travar o check-in mobile (marcar Atendido),
   * que normalmente acontece durante ou logo depois da sessão. Usa o
   * horário local do servidor, como o resto do código (moment sem timezone
   * explícito).
   */
  private isEventoPassado(dataOcorrencia: string, horaFim: string): boolean {
    if (!dataOcorrencia || !horaFim) {
      return false;
    }

    const fimEvento = moment(
      `${dataOcorrencia} ${horaFim}`,
      'YYYY-MM-DD HH:mm',
    );

    if (!fimEvento.isValid()) {
      return false;
    }

    const limiteEdicao = fimEvento
      .clone()
      .add(TOLERANCIA_EVENTO_PASSADO_HORAS, 'hours');

    return limiteEdicao.isBefore(moment());
  }

  /**
   * Para evento passado, a regra só permite alterar o status (e a baixa
   * decorrente dele) — nenhum outro campo pode mudar, nem os que a edição
   * normal libera (paciente, especialidade, terapeuta, função, local,
   * observação). Lança erro se algo além do status foi alterado.
   */
  private assertSomenteStatusAlterado(data: any, original: any) {
    if (!original) {
      return;
    }

    const camposQueNaoPodemMudar: Array<[string, string]> = [
      ['pacienteId', 'paciente'],
      ['especialidadeId', 'especialidade'],
      ['terapeutaId', 'terapeuta'],
      ['funcaoId', 'função'],
      ['localidadeId', 'localidade'],
      ['observacao', 'observação'],
    ];

    const campoAlterado = camposQueNaoPodemMudar.find(
      ([campo]) => data[campo] !== original[campo],
    );

    if (campoAlterado) {
      throw new Error(
        `Evento já ocorreu: não é possível alterar ${campoAlterado[1]}, apenas o status.`,
      );
    }
  }

  /**
   * Em evento passado, o único status para o qual a edição pode resultar é
   * "Atestado" — definição fechada com o negócio. Qualquer outro valor
   * (Atendido, Falta, Cancelado com/sem Antecedência etc.) é rejeitado,
   * mesmo que `assertSomenteStatusAlterado` já tenha aceitado que só o
   * status mudou.
   */
  private async assertStatusPermitidoParaEventoPassado(
    statusEventosId: number,
  ) {
    const prisma = getPrismaClient(this.prismaService);

    const status = await prisma.statusEventos.findUnique({
      select: { nome: true },
      where: { id: Number(statusEventosId) },
    });

    const nome = (status?.nome || '').toLowerCase();

    if (nome !== 'atestado') {
      throw new Error(
        'Evento já ocorreu: o único status permitido para alteração é "Atestado".',
      );
    }
  }

  private async resolveStatusCancelamento(
    statusEventosId: number,
    dataOcorrencia: string,
    horaInicio: string,
  ): Promise<{ id: number; cobrar: boolean; nome: string }> {
    const prisma = getPrismaClient(this.prismaService);

    const statusAtual = await prisma.statusEventos.findUnique({
      select: { id: true, nome: true, cobrar: true },
      where: { id: Number(statusEventosId) },
    });

    const nomeAtual = (statusAtual?.nome || '').toLowerCase();
    const ehStatusDeAntecedencia =
      nomeAtual.includes('cancelado com antecedência') ||
      nomeAtual.includes('cancelado sem antecedência');

    if (!ehStatusDeAntecedencia || !dataOcorrencia || !horaInicio) {
      return statusAtual as any;
    }

    const inicioEvento = moment(
      `${dataOcorrencia} ${horaInicio}`,
      'YYYY-MM-DD HH:mm',
    );

    if (!inicioEvento.isValid()) {
      return statusAtual as any;
    }

    const horasParaEvento = inicioEvento.diff(moment(), 'hours', true);
    const comAntecedencia = horasParaEvento >= ANTECEDENCIA_CANCELAMENTO_HORAS;

    const statusCorreto = await prisma.statusEventos.findFirst({
      select: { id: true, cobrar: true, nome: true },
      where: {
        nome: comAntecedencia
          ? 'Cancelado com Antecedência'
          : 'Cancelado sem Antecedência',
      },
    });

    return (statusCorreto as any) ?? statusAtual;
  }

  /**
   * Valida se paciente, terapeuta, função, status e localidade existem,
   * estão ativos e são compatíveis entre si:
   *  - a terapeuta possui a especialidade do evento (terapeuta só tem 1);
   *  - a função pertence a essa especialidade;
   *  - a terapeuta possui essa função cadastrada;
   *  - o paciente possui essa especialidade vinculada (fila/atendimento).
   * Lança erro descritivo e não cria/atualiza nada quando algo não bate,
   * mesmo que os IDs tenham sido enviados manualmente (fora do que o
   * frontend normalmente oferece nos dropdowns).
   */
  private async validateAgendamentoVinculos({
    pacienteId,
    terapeutaId,
    especialidadeId,
    funcaoId,
    statusEventosId,
    localidadeId,
  }: {
    pacienteId: number;
    terapeutaId: number;
    especialidadeId: number;
    funcaoId: number;
    statusEventosId: number;
    localidadeId: number | null;
  }) {
    const prisma = getPrismaClient(this.prismaService);

    // Atendimento externo (isExterno) não tem localidade — só busca/valida
    // quando localidadeId veio preenchido.
    const [paciente, terapeuta, funcao, statusEventos, localidade] =
      await Promise.all([
        prisma.paciente.findUnique({
          select: {
            id: true,
            disabled: true,
            vaga: {
              select: {
                especialidades: { select: { especialidadeId: true } },
              },
            },
          },
          where: { id: Number(pacienteId) },
        }),
        prisma.terapeuta.findUnique({
          select: {
            especialidadeId: true,
            usuario: { select: { ativo: true } },
            funcoes: { select: { funcaoId: true } },
          },
          where: { usuarioId: Number(terapeutaId) },
        }),
        prisma.funcao.findUnique({
          select: { especialidadeId: true, ativo: true },
          where: { id: Number(funcaoId) },
        }),
        prisma.statusEventos.findUnique({
          select: { ativo: true },
          where: { id: Number(statusEventosId) },
        }),
        localidadeId
          ? prisma.localidade.findUnique({
              select: { ativo: true },
              where: { id: Number(localidadeId) },
            })
          : Promise.resolve(null),
      ]);

    if (!paciente || paciente.disabled) {
      throw new Error('Paciente não encontrado ou inativo.');
    }

    if (!terapeuta || !terapeuta.usuario?.ativo) {
      throw new Error('Terapeuta não encontrada ou inativa.');
    }

    if (!funcao || !funcao.ativo) {
      throw new Error('Função não encontrada ou inativa.');
    }

    if (!statusEventos || !statusEventos.ativo) {
      throw new Error('Status do evento não encontrado ou inativo.');
    }

    if (localidadeId && (!localidade || !localidade.ativo)) {
      throw new Error('Localidade não encontrada ou inativa.');
    }

    if (terapeuta.especialidadeId !== Number(especialidadeId)) {
      throw new Error('A terapeuta selecionada não possui essa especialidade.');
    }

    if (funcao.especialidadeId !== Number(especialidadeId)) {
      throw new Error(
        'A função selecionada não pertence a essa especialidade.',
      );
    }

    const terapeutaTemFuncao = terapeuta.funcoes.some(
      (f: any) => f.funcaoId === Number(funcaoId),
    );
    if (!terapeutaTemFuncao) {
      throw new Error('A terapeuta selecionada não possui essa função.');
    }

    const especialidadesPaciente = (paciente.vaga?.especialidades || []).map(
      (e: any) => e.especialidadeId,
    );
    if (!especialidadesPaciente.includes(Number(especialidadeId))) {
      throw new Error('O paciente não possui essa especialidade vinculada.');
    }
  }

  /**
   * Snapshot financeiro (R17): calcula o valor da sessão (por especialidade
   * do paciente), comissão da terapeuta (por função) e as tarifas de
   * km/devolutiva vigentes *agora*, para gravar no evento. Chamado sempre
   * que paciente/especialidade/terapeuta/função mudam (criação ou edição
   * que troca algum desses vínculos) — nunca recalculado depois disso, para
   * que um reajuste de valor/comissão feito no cadastro não reescreva
   * relatórios de eventos já gravados. `FinanceiroService` passa a preferir
   * esses campos em vez de sempre reler o cadastro atual.
   */
  private async computeFinanceiroSnapshot({
    pacienteId,
    especialidadeId,
    terapeutaId,
    funcaoId,
  }: {
    pacienteId: number;
    especialidadeId: number;
    terapeutaId: number;
    funcaoId: number;
  }) {
    const prisma = getPrismaClient(this.prismaService);

    const [vaga, comissao] = await Promise.all([
      prisma.vaga.findUnique({
        select: { id: true },
        where: { pacienteId: Number(pacienteId) },
      }),
      prisma.terapeutaOnFuncao.findUnique({
        where: {
          terapeutaId_funcaoId: {
            terapeutaId: Number(terapeutaId),
            funcaoId: Number(funcaoId),
          },
        },
      }),
    ]);

    const vagaOnEspecialidade = vaga
      ? await prisma.vagaOnEspecialidade.findUnique({
          where: {
            vagaId_especialidadeId: {
              vagaId: vaga.id,
              especialidadeId: Number(especialidadeId),
            },
          },
        })
      : null;

    return {
      valorSessaoSnapshot: vagaOnEspecialidade?.valor ?? null,
      comissaoSnapshot: comissao?.comissao ?? null,
      tipoComissaoSnapshot: comissao?.tipo ?? null,
      valorPorKmSnapshot: VALOR_POR_KM,
      valorSessaoDevolutivaSnapshot: VALOR_SESSAO_DEVOLUTIVA,
    };
  }

  /**
   * Valida horário inicial < final, faixa 8h–20h e se os dias do evento
   * (o único dia, se for evento único; ou os dias da semana, se recorrente)
   * estão dentro da jornada cadastrada da terapeuta (Terapeuta.cargaHoraria).
   */
  private async validateJornada({
    terapeutaId,
    dataInicio,
    start,
    end,
    diasFrequencia,
    frequenciaId,
  }: {
    terapeutaId: number;
    dataInicio: string;
    start: string;
    end: string;
    diasFrequencia: string[] | string;
    frequenciaId: number;
  }) {
    if (!start || !end || start >= end) {
      throw new Error('O horário inicial deve ser menor que o horário final.');
    }

    if (start < '08:00' || end > '20:00') {
      throw new Error('O evento deve estar entre 08:00 e 20:00.');
    }

    const prisma = getPrismaClient(this.prismaService);
    const terapeuta = await prisma.terapeuta.findUnique({
      select: { cargaHoraria: true },
      where: { usuarioId: Number(terapeutaId) },
    });

    const cargaHoraria =
      terapeuta?.cargaHoraria && typeof terapeuta.cargaHoraria === 'string'
        ? JSON.parse(terapeuta.cargaHoraria)
        : {};

    const dias = (
      Number(frequenciaId) === 1
        ? [moment(dataInicio, 'YYYY-MM-DD').isoWeekday()]
        : (Array.isArray(diasFrequencia)
            ? diasFrequencia
            : (diasFrequencia || '').split(',').filter(Boolean)
          ).map(Number)
    ).filter((dia) => !Number.isNaN(dia) && dia >= 1 && dia <= 7);

    for (const isoDia of dias) {
      const nomeDia = weekDay[isoDia - 1];
      const horariosDia = nomeDia ? cargaHoraria[nomeDia] : undefined;

      if (!horariosDia) {
        throw new Error(
          `A terapeuta não tem jornada cadastrada para ${
            nomeDia || 'domingo'
          }.`,
        );
      }

      const slotsDoEvento = HOURS.filter((hora) => hora >= start && hora < end);
      const foraDaJornada = slotsDoEvento.some((hora) => !horariosDia[hora]);

      if (foraDaJornada) {
        throw new Error(
          `Horário fora da jornada cadastrada da terapeuta em ${nomeDia}.`,
        );
      }
    }
  }

  private resolveHorizonteRecorrencia(dataInicio: string, dataFim?: string) {
    return (
      dataFim || dateAddtDay(dataInicio, HORIZONTE_RECORRENCIA_SEM_FIM_DIAS)
    );
  }

  /**
   * Verifica se já existe outro evento (ativo, não cancelado) da mesma
   * terapeuta cuja data e horário se sobrepõem ao evento sendo criado/
   * editado — considerando ocorrências de séries recorrentes de ambos os
   * lados. Retorna o evento conflitante (para mensagem de erro) ou null.
   */
  private async hasScheduleConflict({
    terapeutaId,
    dataInicio,
    dataFim,
    start,
    end,
    diasFrequencia,
    frequenciaId,
    intervaloId,
    excludeGroupId,
  }: {
    terapeutaId: number;
    dataInicio: string;
    dataFim?: string;
    start: string;
    end: string;
    diasFrequencia: string[] | string;
    frequenciaId: number;
    intervaloId: number;
    excludeGroupId?: string;
  }) {
    const prisma = getPrismaClient(this.prismaService);

    const novoFim = this.resolveHorizonteRecorrencia(dataInicio, dataFim);

    const existentes: any[] = await prisma.calendario.findMany({
      select: {
        groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        frequenciaId: true,
        intervaloId: true,
        exdate: true,
        statusEventos: { select: { nome: true } },
      },
      where: {
        terapeutaId: Number(terapeutaId),
        ...(excludeGroupId ? { groupId: { not: excludeGroupId } } : {}),
        dataInicio: { lte: novoFim },
        OR: [{ dataFim: '' }, { dataFim: { gte: dataInicio } }],
      },
    });

    if (!existentes.length) {
      return null;
    }

    const diasNovos = Array.isArray(diasFrequencia)
      ? diasFrequencia
      : (diasFrequencia || '').split(',').filter(Boolean);

    const datasNovas =
      Number(frequenciaId) === 1
        ? [dataInicio]
        : getDates(
            diasNovos,
            dataInicio,
            novoFim,
            Number(intervaloId) || 1,
            [],
          );

    for (const existente of existentes) {
      const statusNome = existente.statusEventos?.nome?.toLowerCase?.() || '';
      if (statusNome.includes('cancelado')) {
        continue;
      }

      const existenteFim = this.resolveHorizonteRecorrencia(
        existente.dataInicio,
        existente.dataFim || undefined,
      );
      const existenteDias = existente.diasFrequencia
        ? existente.diasFrequencia.split(',').filter(Boolean)
        : [];
      const existenteExdate = existente.exdate
        ? existente.exdate.split(',')
        : [];

      const datasExistentes =
        existente.frequenciaId === 1
          ? [existente.dataInicio]
          : getDates(
              existenteDias,
              existente.dataInicio,
              existenteFim,
              existente.intervaloId || 1,
              existenteExdate,
            );

      const datasExistentesSet = new Set(datasExistentes);
      const temDataEmComum = datasNovas.some((data) =>
        datasExistentesSet.has(data),
      );

      if (!temDataEmComum) {
        continue;
      }

      const horarioSobrepoe =
        start < (existente.end || existente.start) && end > existente.start;

      if (horarioSobrepoe) {
        return existente;
      }
    }

    return null;
  }

  /**
   * Ponto único de validação de um evento antes de gravar: vínculos
   * (paciente/terapeuta/função/especialidade), jornada da terapeuta e
   * conflito de horário.
   *
   * Na criação (sem `original`), tudo é sempre validado. Na edição,
   * como data/horário/frequência/intervalo/dias já são travados por
   * `formatEvent`, só faz sentido revalidar jornada/conflito quando a
   * terapeuta realmente mudou — do contrário estaríamos revalidando o
   * mesmo horário contra a jornada atual a cada edição trivial (ex.: só
   * mudar a observação), o que poderia quebrar uma edição legítima caso a
   * jornada da terapeuta tenha sido alterada depois da criação do evento.
   * Vínculos (paciente/especialidade/terapeuta/função/local/status) são
   * revalidados sempre que qualquer um deles muda.
   */
  private async validateEvento(
    data: any,
    options: { excludeGroupId?: string; original?: any } = {},
  ) {
    const { excludeGroupId, original } = options;

    if (data.isExterno) {
      if (Number(data.km) < 0) {
        throw new Error('Quilometragem não pode ser negativa.');
      }

      if (!(Number(data.km) > 0)) {
        throw new Error(
          'Quilometragem é obrigatória para atendimento externo.',
        );
      }

      if (!data.localExternoDescricao || !data.localExternoDescricao.trim()) {
        throw new Error(
          'Descrição do local externo é obrigatória para atendimento externo.',
        );
      }
    } else if (!data.localidadeId) {
      throw new Error('Localidade é obrigatória.');
    }

    const vinculosMudaram =
      !original ||
      original.pacienteId !== data.pacienteId ||
      original.especialidadeId !== data.especialidadeId ||
      original.terapeutaId !== data.terapeutaId ||
      original.funcaoId !== data.funcaoId ||
      original.localidadeId !== data.localidadeId ||
      original.statusEventosId !== data.statusEventosId;

    if (vinculosMudaram) {
      await this.validateAgendamentoVinculos({
        pacienteId: data.pacienteId,
        terapeutaId: data.terapeutaId,
        especialidadeId: data.especialidadeId,
        funcaoId: data.funcaoId,
        statusEventosId: data.statusEventosId,
        localidadeId: data.localidadeId,
      });
    }

    // Snapshot financeiro só é recalculado quando o que realmente afeta o
    // valor muda (paciente/especialidade/terapeuta/função) — diferente de
    // `vinculosMudaram` acima, que também dispara em mudança de
    // status/localidade e não deveria "descongelar" o valor só por isso.
    const camposFinanceirosMudaram =
      !original ||
      original.pacienteId !== data.pacienteId ||
      original.especialidadeId !== data.especialidadeId ||
      original.terapeutaId !== data.terapeutaId ||
      original.funcaoId !== data.funcaoId;

    if (camposFinanceirosMudaram) {
      Object.assign(
        data,
        await this.computeFinanceiroSnapshot({
          pacienteId: data.pacienteId,
          especialidadeId: data.especialidadeId,
          terapeutaId: data.terapeutaId,
          funcaoId: data.funcaoId,
        }),
      );
    }

    const terapeutaMudou =
      !original || original.terapeutaId !== data.terapeutaId;

    if (!terapeutaMudou) {
      return;
    }

    await this.validateJornada({
      terapeutaId: data.terapeutaId,
      dataInicio: data.dataInicio,
      start: data.start,
      end: data.end,
      diasFrequencia: data.diasFrequencia,
      frequenciaId: data.frequenciaId,
    });

    const conflito = await this.hasScheduleConflict({
      terapeutaId: data.terapeutaId,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      start: data.start,
      end: data.end,
      diasFrequencia: data.diasFrequencia,
      frequenciaId: data.frequenciaId,
      intervaloId: data.intervaloId,
      excludeGroupId,
    });

    if (conflito) {
      throw new Error(
        `Conflito de horário: a terapeuta já tem evento de ${conflito.start} às ${conflito.end} nesse período (groupId ${conflito.groupId}).`,
      );
    }
  }

  async formatEvents(eventos: any, login: string) {
    const usuario = await this.userService.getUser(login);

    // Item 6 do pedido do front: existência de registro de Sessao não dá
    // pra inferir por "atendido OU data passada" (uma sessão de dias atrás
    // nunca aberta não tem registro, mas passaria nessa heurística) — 1
    // consulta batch pelos calendarioId de todos os eventos da página.
    const prisma = getPrismaClient(this.prismaService);
    const idsValidos = eventos
      .map((evento: any) => evento?.id)
      .filter((id: any) => typeof id === 'number');

    const sessoesRegistradas = idsValidos.length
      ? await prisma.sessao.findMany({
          select: { calendarioId: true },
          where: { calendarioId: { in: idsValidos } },
        })
      : [];
    const idsComSessao = new Set(
      sessoesRegistradas.map((s: any) => s.calendarioId),
    );

    const eventosFormat = await Promise.all(
      eventos.map((evento: any) => {
        if (!evento) {
          return {};
        }

        let formated: any = {};

        const statusEventos =
          evento?.statusEventos?.nome?.toLowerCase?.() || 'sem status';

        const especialidadeNome =
          evento?.especialidade?.nome || 'Sem especialidade';
        const especialidadeCor = evento?.especialidade?.cor || '#94a3b8';
        const startValue = evento?.start || '00:00';
        const frequenciaId = Number(evento?.frequencia?.id ?? 1);
        const intervaloId = Number(evento?.intervalo?.id ?? 1);
        const diasFrequenciaList = Array.isArray(evento?.diasFrequencia)
          ? evento.diasFrequencia
          : typeof evento?.diasFrequencia === 'string'
          ? evento.diasFrequencia.split(',')
          : [];
        const exdateList = Array.isArray(evento?.exdate)
          ? evento.exdate
          : typeof evento?.exdate === 'string'
          ? evento.exdate.split(',')
          : [];

        const cor = statusEventos.includes('cancelado')
          ? '#f87171'
          : especialidadeCor;
        if (evento?.especialidade) {
          delete evento.especialidade.cor;
        }

        evento.borderColor = statusEventos.includes('cancelado')
          ? 'cancelado'
          : `border-${especialidadeNome.toLowerCase()}`;

        const localidadeNomeFormatado = evento?.localidade
          ? this.localidadadeService.formatLocalidade(evento.localidade)
          : '-';

        // Regra que o front hoje decide sozinho (isExterno ? descrição
        // externa : nome da localidade, com km concatenado quando
        // externo): centralizada aqui pra devolver pronta em
        // `localExibicao`.
        if (evento?.isExterno) {
          const kmValue = readDecimal(evento?.km);
          const descricaoExterna = evento?.localExternoDescricao || 'Local externo';
          evento.localExibicao =
            kmValue > 0 ? `${descricaoExterna} - ${kmValue}km` : descricaoExterna;
        } else {
          evento.localExibicao = localidadeNomeFormatado;
        }

        evento.localidade = {
          nome: localidadeNomeFormatado,
          id: evento?.localidade?.id || null,
        };

        evento.terapeuta = {
          nome: evento?.terapeuta?.usuario?.nome || '-',
          id: evento?.terapeuta?.usuario?.id || null,
        };

        // Distingue de "vaga livre" (id: 0, ver TerapeutaService.eventFree)
        // sem depender de sentinela de id — todo evento que passa por aqui
        // é um evento real vindo do banco.
        evento.tipo = 'agendado';

        // Item 6 do pedido do front: existe registro de sessão de verdade
        // pra esse evento? (não é heurística — vem da query batch acima).
        evento.temSessaoRegistrada = idsComSessao.has(evento.id);

        // Item 6: card bloqueado pra abrir a tela de Sessão quando o
        // status atual não é configurado como "atender" — decisão movida
        // pro cadastro de StatusEventos (campo atender, ver
        // StatusEventoService), sem hardcode de nome de status nem de data
        // aqui. Cada status decide isso por si (ex.: "Atendido" pode
        // liberar; "Cancelado *"/"Falta" tendem a não liberar) — quem
        // configura é o cadastro, não este código.
        evento.sessaoBloqueada = !evento?.statusEventos?.atender;

        const safeStatusEventos = evento?.statusEventos || {};
        const safeModalidade = evento?.modalidade || {};
        const safePaciente = evento?.paciente || {};
        const safeEspecialidade = evento?.especialidade || {};
        const safeFrequencia = evento?.frequencia || {};
        const safeIntervalo = evento?.intervalo || {};

        evento.statusEventos = safeStatusEventos;
        evento.modalidade = safeModalidade;
        evento.paciente = safePaciente;
        evento.especialidade = safeEspecialidade;
        evento.frequencia = safeFrequencia;
        evento.intervalo = safeIntervalo;

        evento.diasFrequencia = diasFrequenciaList;

        evento.exdate = exdateList.map((ex: string) => `${ex} ${startValue}`);

        evento.canDelete = evento.usuarioId === usuario.id;

        const diasFrequencia: number[] = diasFrequenciaList.map(
          (dia: string) => {
            const parsed = Number(dia);

            if (Number.isNaN(parsed)) {
              return parsed;
            }

            return parsed === 7 ? 0 : parsed;
          },
        );

        switch (true) {
          case frequenciaId !== 1 && intervaloId === 1: // com dias selecionados e todas semanas
            formated = {
              ...evento,
              data: {
                start: evento.start,
                end: evento.end,
              },
              title: evento?.paciente?.nome || 'Sem paciente',
              groupId: evento.groupId,
              daysOfWeek: diasFrequencia,
              isChildren: evento.isChildren,
              startTime: evento.start,
              endTime: evento.end,
              // borderColor: cor,
              backgroundColor: cor,
              rrule: {
                freq: 'weekly',
                // byweekday: diasFrequencia,
                dtstart: formatDateTime(startValue, evento.dataInicio),
              },
            };

            if (evento.dataFim) {
              formated.rrule.until = formatDateTime(startValue, evento.dataFim);
            }

            break;
          case frequenciaId !== 1 && intervaloId !== 1: // com dias selecionados e intervalos
            formated = {
              ...evento,
              data: {
                start: evento.start,
                end: evento.end,
              },
              title: evento?.paciente?.nome || 'Sem paciente',
              groupId: evento.groupId,
              // borderColor: cor,
              backgroundColor: cor,
              isChildren: evento.isChildren,
              rrule: {
                freq: 'weekly',
                interval: intervaloId || 1,
                byweekday: diasFrequencia,
                dtstart: `${evento.dataInicio}T${startValue}:00Z`,
              },
            };

            if (evento.dataFim) {
              formated.rrule.until = `${evento.dataFim}T${
                evento.end || startValue
              }:00Z`;
            }

            break;

          default: // evento unico
            formated = {
              ...evento,
              groupId: evento.groupId,
              data: {
                start: evento.start,
                end: evento.end,
              },
              title: evento?.paciente?.nome || 'Sem paciente',
              date: evento.dataInicio,
              start: formatDateTime(startValue, evento.dataInicio),
              end: formatDateTime(evento.end || startValue, evento.dataInicio),
              // borderColor: cor,
              backgroundColor: cor,
              allDay: false,
              isChildren: evento.isChildren,
            };

            delete formated.diasFrequencia;
            break;
        }

        return formated;
      }),
    );

    return eventosFormat;
  }

  async getFilter(params: any, query: any, login: string) {
    const prisma = getPrismaClient(this.prismaService);

    const inicioDoMes = params.start;
    const ultimoDiaDoMes = params.end;

    const filter = this.buildQueryFilter(query);

    const eventos: any = await prisma.calendario.findMany({
      select: this.getCalendarioSelect({ includeCobrar: true }),
      where: {
        ...filter,
        ...buildDateRangeWhere(inicioDoMes, ultimoDiaDoMes),
      },
    });

    const eventosFormat = Boolean(eventos)
      ? await this.formatEvents(eventos, login)
      : [];

    const ocorrencias = this.expandRecurringOccurrences(
      eventosFormat,
      inicioDoMes,
      ultimoDiaDoMes,
    );

    return this.applyPermissionFlags(ocorrencias, login);
  }

  async getRange(params: any, device: string, login: string) {
    const prisma = getPrismaClient(this.prismaService);

    let inicioDoMes = params.start;
    let ultimoDiaDoMes = params.end;

    if (device === 'mobile') {
      const now = new Date();
      const mouth = now.getMonth();
      inicioDoMes = getPrimeiroDoMes(now.getFullYear(), mouth - 1);
      ultimoDiaDoMes = getPrimeiroDoMes(now.getFullYear(), mouth + 2);
    }

    const eventos = await prisma.calendario.findMany({
      select: this.getCalendarioSelect({ includeUsuarioId: true }),
      where: buildDateRangeWhere(inicioDoMes, ultimoDiaDoMes),
    });

    const eventosFormat = await this.formatEvents(eventos, login);

    const ocorrencias = this.expandRecurringOccurrences(
      eventosFormat,
      inicioDoMes,
      ultimoDiaDoMes,
    );

    return this.applyPermissionFlags(ocorrencias, login);
  }

  /**
   * Item 3 do pedido do front (heron-list-web): flags de permissão/estado
   * calculadas no servidor (relógio do servidor, perfil real do usuário
   * logado) em vez do cliente comparar statusEventos.nome com texto livre
   * e checar "já passou" com o relógio do navegador
   * (components/view-evento/index.tsx: canMarkAsAttended/canMarkAsAttested;
   * components/calendar/index.tsx: isAttendedEvent/isCanceledEvent —
   * ambas fazem .includes('cancelado') no nome, quebra se o texto mudar).
   *
   * Só roda depois de expandRecurringOccurrences: pra série recorrente,
   * "já passou" só faz sentido pra uma ocorrência concreta (com date
   * resolvido), não pra definição da série inteira.
   */
  private async applyPermissionFlags(items: any[], login: string) {
    const usuario = await this.userService.getUser(login);
    const perfilNome = usuario?.perfil?.nome;

    const isDev = perfilNome === PERFIL.dev;
    const isTerapeuta = perfilNome === PERFIL.terapeuta;
    const isAtendente = perfilNome === PERFIL.secretaria;

    return items.map((item: any) => {
      const statusNome = (item?.statusEventos?.nome || '').trim();
      const vago = item?.paciente?.nome === 'Livre';
      const isAttended = statusNome === 'Atendido';
      const isCanceled = statusNome.toLowerCase().includes('cancelado');
      const jaPassou = item?.date ? moment(item.date).isBefore(moment()) : false;

      const podeMarcarAtendido =
        (isDev || isTerapeuta) && !isAttended && !jaPassou && !vago;

      const podeMarcarAtestado =
        (isDev || isAtendente) &&
        jaPassou &&
        !vago &&
        !isAttended &&
        statusNome !== 'Atestado';

      // Item 1 dos "pontos menores" (heron-list-web): "3/8 semanas" era
      // calculado no cliente (view-evento/index.tsx: avaliationCount +
      // diffWeek) só pra modalidade "Avaliação". Mesma conta aqui —
      // semana atual (desde dataInicio até a ocorrência, +1) e semana
      // total (desde dataInicio até dataFim, +1).
      const avaliacaoProgresso =
        item?.modalidade?.nome === 'Avaliação' && item?.dataInicio && item?.dataFim
          ? {
              atual: moment(item.date || item.dataInicio).diff(
                moment(item.dataInicio),
                'weeks',
              ) + 1,
              total:
                moment(item.dataFim).diff(moment(item.dataInicio), 'weeks') + 1,
            }
          : null;

      return {
        ...item,
        isAttended,
        isCanceled,
        vago,
        podeMarcarAtendido,
        podeMarcarAtestado,
        avaliacaoProgresso,
      };
    });
  }

  /**
   * Item 5 do pedido do front (heron-list-web): /evento/filtro/:start/:end
   * mandava uma linha só por série recorrente (rrule.freq/dtstart/until +
   * exdate) e o cliente reconstruía cada ocorrência dentro do período
   * visível na mão (components/calendar/index.tsx: expandRecurringEvent).
   * Aqui, a mesma expansão roda uma vez só, no servidor — cada ocorrência
   * concreta dentro de [rangeStart, rangeEnd] vira 1 item de resposta, com
   * date/start/end já resolvidos; rrule/daysOfWeek somem da resposta
   * (undefined não serializa no JSON).
   *
   * Convenção de dia da semana: igual à de diasFrequencia em todo o
   * resto do arquivo — 0=domingo..6=sábado (moment().day(), não
   * isoWeekday()); "semana" pra fins de `interval` é sempre segunda a
   * domingo (isoWeek), ancorada na semana de dataInicio.
   *
   * Eventos que não têm dados suficientes pra expandir (sem
   * dataInicio/dias da semana) voltam como vieram, sem quebrar a
   * resposta — mais seguro que descartar silenciosamente.
   */
  private expandRecurringOccurrences(
    items: any[],
    rangeStart: string,
    rangeEnd: string,
  ): any[] {
    const rangeStartM = moment(rangeStart, 'YYYY-MM-DD');
    const rangeEndM = moment(rangeEnd, 'YYYY-MM-DD');

    if (!rangeStartM.isValid() || !rangeEndM.isValid()) {
      return items;
    }

    const resultado: any[] = [];

    items.forEach((item: any) => {
      if (!item?.rrule?.freq) {
        resultado.push(item);
        return;
      }

      const diasSemana: number[] =
        Array.isArray(item.daysOfWeek) && item.daysOfWeek.length
          ? item.daysOfWeek
          : Array.isArray(item.rrule.byweekday)
          ? item.rrule.byweekday
          : [];

      const seriesStart = moment(item.dataInicio, 'YYYY-MM-DD');

      if (!diasSemana.length || !seriesStart.isValid()) {
        resultado.push(item);
        return;
      }

      const interval = Number(item.rrule.interval) || 1;
      const seriesEnd = item.dataFim
        ? moment(item.dataFim, 'YYYY-MM-DD').endOf('day')
        : null;

      const exdateDias = new Set(
        (Array.isArray(item.exdate) ? item.exdate : [])
          .map((ex: string) => String(ex).trim().slice(0, 10))
          .filter(Boolean),
      );

      const janelaInicio = moment.max(rangeStartM, seriesStart.clone().startOf('day'));
      const janelaFim = seriesEnd ? moment.min(rangeEndM, seriesEnd) : rangeEndM;

      if (janelaFim.isBefore(janelaInicio, 'day')) {
        return; // série não cruza a janela pedida — nenhuma ocorrência aqui
      }

      const semanaInicioSerie = seriesStart.clone().startOf('isoWeek');

      for (
        const cursor = janelaInicio.clone();
        cursor.isSameOrBefore(janelaFim, 'day');
        cursor.add(1, 'day')
      ) {
        const diaSemana = cursor.day(); // 0=domingo..6=sábado

        if (!diasSemana.includes(diaSemana)) {
          continue;
        }

        const semanasDesdeInicio = cursor
          .clone()
          .startOf('isoWeek')
          .diff(semanaInicioSerie, 'weeks');

        if (semanasDesdeInicio % interval !== 0) {
          continue;
        }

        const dataOcorrencia = cursor.format('YYYY-MM-DD');

        if (exdateDias.has(dataOcorrencia)) {
          continue;
        }

        resultado.push({
          ...item,
          date: dataOcorrencia,
          start: formatDateTime(item.start, dataOcorrencia),
          end: formatDateTime(item.end || item.start, dataOcorrencia),
          allDay: false,
          rrule: undefined,
          daysOfWeek: undefined,
          startTime: undefined,
          endTime: undefined,
          // Item 3 dos "pontos menores" (heron-list-web): CalendarForm.tsx
          // recalculava isso 3x (moment(dataAtual).day()) — dia da semana
          // da ocorrência específica que está sendo editada, já resolvido.
          diaSemanaOcorrencia: diaSemana,
        });
      }
    });

    return resultado;
  }

  async createCalendario(body: any, login: string) {
    const user = await this.userService.getUser(login);
    const frequencia: ObjProps =
      !body?.frequencia || body.frequencia === ''
        ? await this.frequenciaService.getFrequenciaName(FREQUENCIA.unico)
        : body.frequencia;

    if (frequencia?.nome === FREQUENCIA.unico) {
      body.dataFim = body.dataInicio;
      body.diasFrequencia = [];
      body.intervalo = {
        id: 1,
        nome: '1 Semana',
      };
    }

    const diasFrequencia = (body?.diasFrequencia || []).join(',');

    if (body.modalidade.nome === 'Devolutiva') {
      return this.createEventoDevolutiva(
        body,
        login,
        diasFrequencia,
        frequencia,
        user,
      );
    } else {
      return this.createEventoDefault(
        body,
        login,
        diasFrequencia,
        frequencia,
        user,
      );
    }
  }

  async createEventoDevolutiva(
    body: any,
    login: string,
    diasFrequencia: any,
    frequencia: any,
    user: any,
  ) {
    const prisma = getPrismaClient(this.prismaService);

    const filter = Object.keys(body).filter(
      (key: string) =>
        key.includes('terapeuta') && Object.keys(body[key]).length,
    );

    const datas: any[] = await Promise.all(
      filter.map(async (key: string) => {
        const index = key.split('terapeuta')[1];

        const hash: string = await this.getHashGroupId(
          body.paciente.id,
          body.modalidade.id,
          body[`especialidade${index}`].id,
          body[`funcao${index}`].id,
        );

        const data = Object.assign({}, body, {
          terapeuta: { id: body[key].id },
          especialidade: { id: body[`especialidade${index}`].id },
          funcao: { id: body[`funcao${index}`].id },
        });

        const { localidadeId, localExternoDescricao } =
          this.resolveLocalidadeAtendimento(data);

        const eventData = this.buildCalendarioPayload({
          body: data,
          userId: user.id,
          frequencia,
          diasFrequencia,
          groupId: hash,
          pacienteId: data.paciente.id,
          modalidadeId: data.modalidade.id,
          especialidadeId: data.especialidade.id,
          terapeutaId: data.terapeuta.id,
          funcaoId: data.funcao.id,
          localidadeId,
          localExternoDescricao,
          statusEventosId: data.statusEventos.id,
          intervaloId: data.intervalo.id,
        });

        await this.validateEvento(eventData);

        return eventData;
      }),
    );

    const resultado = await prisma.calendario.createMany({
      data: datas,
    });

    // createMany não devolve as linhas criadas — busca de volta pelos
    // groupIds únicos que acabaram de ser gerados (1 consulta batch, não
    // 1 por evento) só pra registrar o histórico de cada uma.
    const criados = await prisma.calendario.findMany({
      where: { groupId: { in: datas.map((d: any) => d.groupId) } },
    });

    await Promise.all(
      criados.map((evento: any) =>
        this.historicoService.registrarCriacao('Calendario', evento.id, evento, login),
      ),
    );

    return resultado;
  }

  async createEventoDefault(
    body: CalendarioCreateParam,
    login: string,
    diasFrequencia: any,
    frequencia: any,
    user: any,
  ) {
    const prisma = getPrismaClient(this.prismaService);

    const hash: string = await this.getHashGroupId(
      body.paciente.id,
      body.modalidade.id,
      body.especialidade.id,
      body.funcao.id,
    );

    const { localidadeId, localExternoDescricao } =
      this.resolveLocalidadeAtendimento(body);

    const eventData = this.buildCalendarioPayload({
      body,
      userId: user.id,
      frequencia,
      diasFrequencia,
      groupId: hash,
      pacienteId: body.paciente.id,
      modalidadeId: body.modalidade.id,
      especialidadeId: body.especialidade.id,
      terapeutaId: body.terapeuta.id,
      funcaoId: body.funcao.id,
      localidadeId,
      localExternoDescricao,
      statusEventosId: body.statusEventos.id,
      intervaloId: body.intervalo.id,
    });

    await this.validateEvento(eventData);

    const evento = await prisma.$transaction([
      prisma.calendario.create({
        data: eventData,
      }),
    ]);

    await this.historicoService.registrarCriacao(
      'Calendario',
      evento[0].id,
      evento[0],
      login,
    );

    return evento[0];
  }

  async getHashGroupId(
    pacienteId: number,
    modalidadeId: number,
    especialidadeId: number,
    funcaoId: number,
  ) {
    const plaintext = `${pacienteId} ${modalidadeId} ${especialidadeId} ${funcaoId}`;
    const hash = await bcrypt.hash(plaintext, 10);

    return hash;
  }

  async updateCalendario_(body: any, login: string) {
    const prisma = getPrismaClient(this.prismaService);

    const dataFim = dateSubtractDay(body.dataAtual, 2);
    const isCanceled = body.statusEventos.nome.includes('permanente');
    if (isCanceled && !body?.dataFim) {
      body.dataFim = dataFim;
    }

    const eventoUnico = await prisma.calendario.findFirstOrThrow({
      where: {
        id: body.id,
      },
    });

    let evento;
    switch (true) {
      case body.frequencia.id === 1 && !body.changeAll:
        evento = await prisma.calendario.updateMany({
          data: {
            dataInicio: body?.dataInicio,
            km: body?.km,
            dataFim: body?.dataFim,
            start: body?.start,
            end: body?.end,
            ciclo: body?.ciclo,
            observacao: body?.observacao,
            pacienteId: body?.paciente?.id,
            modalidadeId: body?.modalidade?.id,
            especialidadeId: body?.especialidade?.id,
            terapeutaId: body?.terapeuta?.id,
            funcaoId: body?.funcao?.id,
            localidadeId: body.localidade?.id,
            statusEventosId: body?.statusEventos?.id,
          },
          where: {
            id: body.id,
          },
        });
        break;
      case isCanceled && body.changeAll:
        evento = await prisma.calendario.updateMany({
          data: {
            ...body,
            dataFim,
          },
          where: {
            groupId: body.groupId,
          },
        });
        break;
      case body.changeAll && dataFim !== eventoUnico.dataInicio:
        evento = await prisma.calendario.updateMany({
          data: {
            dataFim,
          },
          where: {
            groupId: body.groupId,
          },
        });

        await this.createCalendario(
          {
            ...body,
            groupId: body.groupId,
            dataInicio: body.dataInicio,
          },
          login,
        );
        break;
      case body.changeAll && dataFim === eventoUnico.dataInicio:
        evento = await prisma.calendario.updateMany({
          data: {
            ...body,
          },
          where: {
            groupId: body.groupId,
          },
        });
        break;
      case body.frequencia.id !== 1 && !body.changeAll:
        const exdate = eventoUnico?.exdate
          ? eventoUnico?.exdate.split(',')
          : [];
        exdate.push(formatDateTime(body.start, body.dataAtual));

        const format = exdate.join(',');

        evento = await prisma.calendario.updateMany({
          data: {
            exdate: format,
          },
          where: {
            id: body.id,
          },
        });

        await this.createCalendario(
          {
            ...body,
            frequenciaId: 1,
            groupId: body.id,
          },
          login,
        );
        break;
      default:
        break;
    }

    return evento;
  }

  /**
   * Snapshot escalar (sem relação nenhuma) de um evento, usado só pra
   * montar o diff de histórico — nunca pra lógica de negócio.
   */
  private async snapshotCalendarioHistorico(id: number) {
    const prisma = getPrismaClient(this.prismaService);
    return prisma.calendario.findUnique({ where: { id } });
  }

  /**
   * Entrada pública de edição — `updateCalendarioMobile` e
   * `updateCalendarioAtestado` delegam pra cá (ver seus corpos), então
   * instrumentar só este ponto já cobre os três caminhos, sem log
   * duplicado. A lógica real (série recorrente, split, baixa, etc.)
   * continua intacta em `updateCalendarioImpl`, logo abaixo — só
   * envolvida por um snapshot de antes/depois pro histórico.
   */
  async updateCalendario(body: any, login: string, hasDataFim = false) {
    const antes = body?.id
      ? await this.snapshotCalendarioHistorico(Number(body.id))
      : null;

    const resultado = await this.updateCalendarioImpl(body, login, hasDataFim);

    if (antes) {
      const depois = await this.snapshotCalendarioHistorico(Number(body.id));
      if (depois) {
        await this.historicoService.registrarEdicao(
          'Calendario',
          Number(body.id),
          antes,
          depois,
          login,
        );
      }
    }

    return resultado;
  }

  private async updateCalendarioImpl(body: any, login: string, hasDataFim = false) {
    const prisma = getPrismaClient(this.prismaService);

    const eventId = Number(body?.id);
    if (!Number.isNaN(eventId)) {
      body.id = eventId;
    }

    const hasGroupId = typeof body?.groupId === 'string' && body.groupId.trim();
    if (!hasGroupId && body?.id) {
      const eventoBase = await prisma.calendario.findFirst({
        select: { groupId: true },
        where: { id: body.id },
      });

      if (eventoBase?.groupId) {
        body.groupId = eventoBase.groupId;
      }
    }

    const eventoSalvo: any[] = await prisma.calendario.findMany({
      where: { groupId: body.groupId },
    });

    if (eventoSalvo.length === 0) {
      throw new Error('Não existe evento desse groupo!');
    }

    if (eventoSalvo.length === 1) {
      return this.updateEventoUnicoGrupo(body, login, hasDataFim);
    }

    // "Editar esta e as próximas" (changeAll) sempre passa por
    // updateEventoRecorrentes -> updateEventoRecorrentesAllChange, que faz o
    // split correto (série antiga ganha dataFim de corte, série nova nasce a
    // partir da data atual). Nunca fazemos updateMany direto por groupId aqui:
    // isso já sobrescreveu ocorrências passadas e outras exceções já
    // materializadas (isChildren) que compartilham o mesmo groupId.
    if (!body.changeAll && body.isChildren) {
      const original = await prisma.calendario.findFirst({
        where: { id: body.id },
      });
      const data = this.formatEvent(body, original);
      const statusResolvido = await this.resolveStatusCancelamento(
        data.statusEventosId,
        data.dataInicio,
        data.start,
      );
      data.statusEventosId = statusResolvido.id;

      if (this.isEventoPassado(data.dataInicio, original?.end)) {
        this.assertSomenteStatusAlterado(data, original);
        await this.assertStatusPermitidoParaEventoPassado(data.statusEventosId);
      }

      // Fora do try/catch de baixo propositalmente: se a validação falhar,
      // o erro precisa subir para o controller, não ser engolido pelo log.
      await this.validateEvento(data, {
        original,
        excludeGroupId: original?.groupId,
      });

      try {
        // Update do evento + criação da baixa decorrente numa transação real
        // (R12): antes, se `baixaService.create` falhasse depois do
        // `calendario.update` já ter gravado, não havia rollback — o evento
        // ficava salvo com o novo status mas sem a baixa correspondente.
        const eventos = await prisma.$transaction(async (tx: any) => {
          const evento = await tx.calendario.update({
            data,
            where: {
              id: body.id,
            },
          });

          if (statusResolvido.cobrar) {
            await this.baixaService.create(
              {
                pacienteId: body.paciente.id,
                terapeutaId: body.terapeuta.id,
                localidadeId: data.localidadeId,
                localExternoDescricao: data.localExternoDescricao,
                statusEventosId: statusResolvido.id,
                eventoId: body.id,
                dataEvento: body.dataInicio,
              },
              tx,
            );
          }

          return evento;
        });

        return eventos;
      } catch (error) {
        console.log(error);
      }
    }

    const evento = eventoSalvo.find((event: any) => event.id === body.id);
    body.exdate = evento?.exdate;
    return this.updateEventoRecorrentes(body, login, hasDataFim);
  }

  async updateEventoUnicoGrupo(event: any, login: string, hasDataFim = false) {
    const prisma = getPrismaClient(this.prismaService);

    if (event?.frequencia?.id === 1) {
      const original = await prisma.calendario.findFirst({
        where: { id: event.id },
      });
      const data = this.formatEvent(event, original);
      const statusResolvido = await this.resolveStatusCancelamento(
        data.statusEventosId,
        data.dataInicio,
        data.start,
      );
      data.statusEventosId = statusResolvido.id;

      if (this.isEventoPassado(data.dataInicio, original?.end)) {
        this.assertSomenteStatusAlterado(data, original);
        await this.assertStatusPermitidoParaEventoPassado(data.statusEventosId);
      }

      await this.validateEvento(data, {
        original,
        excludeGroupId: original?.groupId,
      });

      // Ver comentário equivalente em updateCalendario (R12): update do
      // evento + baixa decorrente numa única transação.
      const eventoAtualizado = await prisma.$transaction(async (tx: any) => {
        const evento = await tx.calendario.update({
          data,
          where: {
            id: event.id,
          },
        });

        if (statusResolvido.cobrar) {
          await this.baixaService.create(
            {
              pacienteId: event.paciente.id,
              terapeutaId: event.terapeuta.id,
              localidadeId: data.localidadeId,
              localExternoDescricao: data.localExternoDescricao,
              statusEventosId: statusResolvido.id,
              eventoId: event.id,
              dataEvento: event.dateAtual,
            },
            tx,
          );
        }

        return evento;
      });

      return eventoAtualizado;
    }

    return this.updateEventoRecorrentes(event, login, hasDataFim);
  }

  async updateCalendarioMobile(
    id: any,
    login: string,
    dataAtual?: string,
    dataFim?: string,
  ) {
    const prisma = getPrismaClient(this.prismaService);

    const [statusEventos, evento]: any = await Promise.all([
      prisma.statusEventos.findFirst({
        where: {
          nome: 'Atendido',
        },
      }),
      prisma.calendario.findFirst({
        select: {
          id: true,
          groupId: true,
          km: true,
          dataInicio: true,
          dataFim: true,
          start: true,
          end: true,
          ciclo: true,
          observacao: true,
          paciente: {
            select: {
              nome: true,
              id: true,
            },
          },
          modalidade: {
            select: {
              nome: true,
              id: true,
            },
          },
          especialidade: {
            select: {
              nome: true,
              id: true,
            },
          },
          terapeuta: true,
          localidade: true,
          funcao: {
            select: {
              nome: true,
              id: true,
            },
          },
          statusEventos: true,
          diasFrequencia: true,
          isExterno: true,
          localExternoDescricao: true,
          frequencia: true,
          intervalo: true,
          exdate: true,
        },
        where: {
          id,
        },
      }),
    ]);

    evento.statusEventos = statusEventos;
    evento.changeAll = false;

    evento.dataAtual = dataAtual || dateFormatYYYYMMDD(new Date());

    if (!!dataFim) {
      evento.dataFim = dataFim;
    }

    return this.updateCalendario(evento, login, !!dataFim);
  }

  async updateCalendarioAtestado(body: any, login: string) {
    const prisma = getPrismaClient(this.prismaService);

    const statusEventos = await prisma.statusEventos.findFirst({
      where: {
        nome: 'Atestado',
      },
    });

    body.statusEventos = statusEventos;

    this.updateCalendario(body, login);
  }

  private getExDate(event: any) {
    const existingExdate =
      typeof event?.exdate === 'string'
        ? event.exdate.split(',')
        : event?.exdate;
    const exdate: string[] = Array.isArray(existingExdate)
      ? existingExdate
      : [];
    if (event?.dataAtual) {
      exdate.push(event.dataAtual);
    }
    return exdate;
  }

  async updateEventoRecorrentes(event: any, login: string, hasDataFim = false) {
    const prisma = getPrismaClient(this.prismaService);

    const original = await prisma.calendario.findFirst({
      where: { id: event.id },
    });
    const data = this.formatEvent(event, original);

    const dataFim = hasDataFim ? event.dataFim : event.dataAtual; //dateSubtractDay(event.dataAtual, 1);

    const statusEventos = event.statusEventos.nome.toLowerCase();
    const isCanceled =
      statusEventos.includes('permanente') ||
      statusEventos.includes('cancelamento');
    if (isCanceled && !event?.dataFim) {
      event.dataFim = dataFim;
    }

    const exdate = this.getExDate(event);

    switch (true) {
      case event.changeAll: // se for mudar todos
        const eventosAll = await this.updateEventoRecorrentesAllChange(
          event,
          exdate.join(','),
          login,
          isCanceled,
        );

        return eventosAll;
      case !event.changeAll: // se nao for mudar todos
        // A ocorrência sendo alterada é a de event.dataAtual (não a data de
        // início da série, que fica travada/original) — é contra ela que a
        // antecedência de cancelamento precisa ser calculada. A baixa desse
        // ramo é criada a partir do "eventos" retornado pelo próprio
        // create/select abaixo, que já reflete o statusEventosId corrigido.
        data.statusEventosId = (
          await this.resolveStatusCancelamento(
            data.statusEventosId,
            event.dataAtual,
            data.start,
          )
        ).id;

        if (this.isEventoPassado(event.dataAtual, data.end)) {
          this.assertSomenteStatusAlterado(data, original);
          await this.assertStatusPermitidoParaEventoPassado(
            data.statusEventosId,
          );
        }

        await this.validateEvento(data, {
          original,
          excludeGroupId: original?.groupId,
        });

        const usuario = await this.userService.getUser(login);

        try {
          // Ver comentário em updateCalendario (R12): as duas escritas em
          // Calendario + a baixa decorrente, atômicas.
          const eventos = await prisma.$transaction(async (tx: any) => {
            const [, novoEvento] = await Promise.all([
              tx.calendario.update({
                data: {
                  exdate: exdate.join(),
                },
                where: {
                  id: event.id,
                },
              }),
              tx.calendario.create({
                select: {
                  id: true,
                  terapeutaId: true,
                  localidadeId: true,
                  localExternoDescricao: true,
                  statusEventos: true,
                  paciente: true,
                },
                data: {
                  ...data,
                  dataInicio: event.dataAtual,
                  dataFim,
                  usuarioId: usuario.id,
                  isChildren: true,
                },
              }),
            ]);

            if (novoEvento.statusEventos.cobrar) {
              await this.baixaService.create(
                {
                  pacienteId: novoEvento.paciente.id,
                  terapeutaId: novoEvento.terapeutaId,
                  localidadeId: novoEvento.localidadeId,
                  localExternoDescricao: novoEvento.localExternoDescricao,
                  statusEventosId: novoEvento.statusEventos.id,
                  eventoId: novoEvento.id,
                  dataEvento: event.dataAtual,
                },
                tx,
              );
            }

            return novoEvento;
          });

          return eventos;
        } catch (error) {
          console.log(error);
          return;
        }
    }
  }

  updateEventoRecorrentesAllChange = async (
    event: any,
    exdate: string,
    login: string,
    isCanceled?: boolean,
  ) => {
    const prisma = getPrismaClient(this.prismaService);

    const evento: any = await prisma.calendario.findFirst({
      where: { id: event.id },
    });

    const dataInicio = transformStringInDate(evento.dataInicio);
    const dataAtual = transformStringInDate(event.dataAtual);

    const data = this.formatEvent(event, evento);
    const statusResolvido = await this.resolveStatusCancelamento(
      data.statusEventosId,
      event.dataAtual,
      data.start,
    );
    data.statusEventosId = statusResolvido.id;

    if (this.isEventoPassado(event.dataAtual, data.end)) {
      this.assertSomenteStatusAlterado(data, evento);
      await this.assertStatusPermitidoParaEventoPassado(data.statusEventosId);
    }

    await this.validateEvento(data, {
      original: evento,
      excludeGroupId: evento.groupId,
    });

    if (exdate !== '') {
      event.exdate = exdate;
    }

    if (dataInicio.isBefore(dataAtual)) {
      const usuario = await this.userService.getUser(login);
      const dataFim = dateAddtDay(event.dataAtual, 1);

      // se data de inicio já passou, for recorrente e mudar todos
      const [, eventos] = await Promise.all([
        prisma.calendario.create({
          data: {
            ...data,
            dataInicio: event.dataAtual,
            usuarioId: usuario.id,
            isChildren: true,
            dataFim,
          },
        }),
        prisma.calendario.updateMany({
          data: {
            // dataFim: dataAtual.subtract(1, 'day').format('YYYY-MM-DD'),
            dataFim: dateSubtractDay(dataAtual.format('YYYY-MM-DD'), 1),
            statusEventosId: evento.statusEventosId,
          },
          where: {
            id: event.id,
          },
        }),
      ]);

      return eventos;
    } else {
      // Ver comentário em updateCalendario (R12): baixa decorrente + update
      // da série numa única transação.
      const eventosAll = await prisma.$transaction(async (tx: any) => {
        if (statusResolvido.cobrar) {
          await this.baixaService.create(
            {
              pacienteId: event.paciente.id,
              terapeutaId: event.terapeuta.id,
              localidadeId: data.localidadeId,
              localExternoDescricao: data.localExternoDescricao,
              statusEventosId: statusResolvido.id,
              eventoId: event.id,
              dataEvento: event.dataAtual,
            },
            tx,
          );
        }

        delete event.dataAtual;
        delete event.data;

        return tx.calendario.updateMany({
          data: {
            ...data,
          },
          where: {
            groupId: data.groupId,
          },
        });
      });

      return eventosAll;
    }
  };

  async delete(eventId: number, login: string) {
    const prisma = getPrismaClient(this.prismaService);

    try {
      const { id } = await this.userService.getUser(login);
      const evento = await prisma.calendario.findFirstOrThrow({
        select: {
          paciente: {
            include: {
              vaga: {
                include: {
                  especialidades: true,
                },
              },
            },
          },
          especialidadeId: true,
          groupId: true,
          dataInicio: true,
          end: true,
        },
        where: { id: Number(eventId) },
      });

      if (this.isEventoPassado(evento.dataInicio, evento.end)) {
        throw new Error('Não é possível excluir um evento que já ocorreu.');
      }

      // `deleteMany({ groupId })` logo abaixo remove a série inteira — não
      // só a ocorrência apontada por `eventId`. Antes disso, o método já
      // bloqueava excluir quando o evento SELECIONADO já tinha passado, mas
      // não olhava as outras linhas da mesma série (splits materializados
      // via isChildren) que podem ter ocorrências passadas mesmo quando
      // `eventId` aponta para uma ocorrência futura. Regra fechada com o
      // negócio: só é permitido excluir a série quando NENHUMA ocorrência
      // dela (passada ou futura) já foi realizada — sem granularidade de
      // "só as próximas" por enquanto.
      const ocorrenciasDaSerie = await prisma.calendario.findMany({
        select: { dataInicio: true, end: true },
        where: { groupId: evento.groupId },
      });

      const temSessaoJaRealizada = ocorrenciasDaSerie.some((ocorrencia) =>
        this.isEventoPassado(ocorrencia.dataInicio, ocorrencia.end),
      );

      if (temSessaoJaRealizada) {
        throw new Error(
          'Não é possível excluir esta série: já existe pelo menos uma sessão já realizada. Só é permitido excluir séries totalmente futuras.',
        );
      }

      await this.vagaService.update({
        desagendar: [evento.especialidadeId],
        agendar: [],
        vagaId: evento.paciente.vaga.id,
        pacienteId: evento.paciente.id,
        statusPacienteCod: evento.paciente.statusPacienteCod,
      });

      await prisma.vaga.update({
        data: {
          naFila: true,
        },
        where: {
          id: evento.paciente.vaga.id,
        },
      });

      const paraExcluir = await prisma.calendario.findMany({
        where: { groupId: evento.groupId, usuarioId: id },
      });

      const resultado = await prisma.calendario.deleteMany({
        where: {
          groupId: evento.groupId,
          usuarioId: id,
        },
      });

      await Promise.all(
        paraExcluir.map((linha: any) =>
          this.historicoService.registrarExclusao('Calendario', linha.id, linha, login),
        ),
      );

      return resultado;
    } catch (error) {
      console.log(error);
      // Antes o erro morria aqui e o controller respondia sucesso mesmo
      // quando nada foi excluído (ex.: evento passado, evento inexistente).
      // Propaga para o controller tratar como falha.
      throw error;
    }
  }

  private async getFinancialEvents(filter: Record<string, any>, orderBy: any) {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.calendario.findMany({
      select: {
        id: true,
        groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        exdate: true,
        km: true,
        ciclo: true,
        observacao: true,
        valorSessaoSnapshot: true,
        comissaoSnapshot: true,
        tipoComissaoSnapshot: true,
        valorPorKmSnapshot: true,
        valorSessaoDevolutivaSnapshot: true,
        paciente: {
          select: {
            nome: true,
            id: true,
            vaga: {
              select: {
                especialidades: true,
              },
            },
          },
        },
        modalidade: {
          select: {
            nome: true,
            id: true,
          },
        },
        especialidade: true,
        terapeuta: {
          select: {
            usuario: {
              select: {
                nome: true,
                id: true,
              },
            },
            funcoes: {
              select: {
                comissao: true,
                tipo: true,
                funcaoId: true,
              },
            },
          },
        },
        funcao: {
          select: {
            nome: true,
            id: true,
          },
        },
        localidade: true,
        statusEventos: {
          select: {
            nome: true,
            cobrar: true,
            id: true,
          },
        },
        frequencia: {
          select: {
            nome: true,
            id: true,
          },
        },
        intervalo: {
          select: {
            nome: true,
            id: true,
          },
        },
      },
      where: filter,
      orderBy,
    });
  }

  async getFilterFinancialPaciente({
    dataInicio,
    dataFim,
    datatFim,
    pacienteId,
    statusEventosId,
  }: any) {
    const filtroDataFim = dataFim || datatFim;

    return this.getFinancialEvents(
      {
        ...buildDateRangeWhere(dataInicio, filtroDataFim),
        pacienteId,
        statusEventosId,
      },
      {
        terapeuta: {
          usuario: {
            nome: 'asc',
          },
        },
      },
    );
  }

  getFilterFinancialTerapeuta = async ({
    dataInicio,
    dataFim,
    datatFim,
    terapeutaId,
  }: any) => {
    const filtroDataFim = dataFim || datatFim;

    return this.getFinancialEvents(
      {
        terapeutaId,
        ...buildDateRangeWhere(dataInicio, filtroDataFim),
      },
      {
        paciente: {
          nome: 'asc',
        },
      },
    );
  };

  async getEventsMessage(dataInicio: string, datatFim: string) {
    const prisma = getPrismaClient(this.prismaService);

    const eventosBrutos = await prisma.calendario.findMany({
      select: {
        dataInicio: true,
        dataFim: true,
        paciente: true,
        statusEventos: true,
        modalidade: true,
        diasFrequencia: true,
        intervalo: true,
        localidade: true,
        terapeuta: {
          select: {
            usuario: {
              select: {
                nome: true,
              },
            },
          },
        },
        start: true,
      },
      where: {
        ...buildDateRangeWhere(dataInicio, datatFim),
        statusEventosId: STATUS_EVENTOS_ID.avisar,
      },
    });

    const eventos: any = [];
    await Promise.all(
      eventosBrutos.map((event: any) => {
        const dataFimParam = event?.dataFim || datatFim;
        const diasFrequencia = event?.diasFrequencia
          ? event.diasFrequencia.split(',')
          : [];
        const intervaloId = event?.intervalo?.id || 1;

        const newEvents = getDatesWhiteEvents(
          diasFrequencia,
          event.dataInicio,
          dataFimParam,
          intervaloId,
          event,
        );

        eventos.push(...newEvents);
      }),
    );

    return eventos;
  }
}
