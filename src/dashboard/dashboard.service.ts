import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaClient } from 'src/util/crud';
import { buildDateRangeWhere } from 'src/util/filters';
import {
  dateFormatYYYYMMDD,
  dateSubtractDay,
  getDates,
} from 'src/util/format-date';

// Estágios reais de StatusPaciente usados no funil "Fluxo de pacientes" —
// só os que existem de fato no cadastro (ver prisma/seed.ts). O mockup
// original pedia "Documentação pendente"/"Autorização", que não existem
// no sistema; decisão do usuário foi usar os estágios reais em vez disso.
const ESTAGIOS_FUNIL = [
  { cod: 'queue_avaliation', nome: 'Fila avaliação' },
  { cod: 'avaliation', nome: 'Avaliação' },
  { cod: 'queue_therapy', nome: 'Fila terapia' },
  { cod: 'therapy', nome: 'Terapia' },
];

export type Periodo = 'hoje' | 'semana' | 'mes';

const ROTULO_PERIODO: Record<Periodo, string> = {
  hoje: 'hoje',
  semana: 'esta semana',
  mes: 'este mês',
};

const ROTULO_PERIODO_ANTERIOR: Record<Periodo, string> = {
  hoje: 'ontem',
  semana: 'semana passada (mesmo trecho)',
  mes: 'mês passado (mesmo trecho)',
};

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  /** Normaliza o valor cru do query param — qualquer coisa fora do
   * esperado cai em "hoje", nunca quebra a rota. */
  static normalizarPeriodo(valor: unknown): Periodo {
    return valor === 'semana' || valor === 'mes' ? valor : 'hoje';
  }

  // ---------------------------------------------------------------------
  // Núcleo compartilhado: ocorrências de Calendario num intervalo de datas
  // ---------------------------------------------------------------------

  /**
   * Resolve um `periodo` (hoje|semana|mes) pro intervalo [inicio, fim] —
   * sempre terminando hoje, nunca no futuro — e o intervalo ANTERIOR
   * equivalente (mesmo tanto de dias decorridos), usado nos deltas do
   * resumo. "semana" começa na segunda-feira (isoWeek); "mes" começa no
   * dia 1.
   */
  private resolverIntervalo(periodo: Periodo) {
    const hoje = dateFormatYYYYMMDD(new Date());

    if (periodo === 'hoje') {
      const ontem = dateSubtractDay(hoje, 1);
      return { inicio: hoje, fim: hoje, inicioAnterior: ontem, fimAnterior: ontem };
    }

    const hojeM = moment(hoje, 'YYYY-MM-DD');
    const inicioM =
      periodo === 'semana' ? hojeM.clone().startOf('isoWeek') : hojeM.clone().startOf('month');
    const diasDecorridos = hojeM.diff(inicioM, 'days');
    const inicioAnteriorM =
      periodo === 'semana'
        ? inicioM.clone().subtract(1, 'week')
        : inicioM.clone().subtract(1, 'month');
    const fimAnteriorM = inicioAnteriorM.clone().add(diasDecorridos, 'days');

    return {
      inicio: inicioM.format('YYYY-MM-DD'),
      fim: hoje,
      inicioAnterior: inicioAnteriorM.format('YYYY-MM-DD'),
      fimAnterior: fimAnteriorM.format('YYYY-MM-DD'),
    };
  }

  /**
   * Busca os candidatos de Calendario que TOCAM o intervalo [inicio, fim]
   * (mesmo filtro usado pela agenda, ver buildDateRangeWhere) só com
   * campos escalares — nenhuma relação aninhada na consulta. Nomes
   * (paciente/terapeuta/especialidade/etc.) são resolvidos depois, em
   * consultas simples separadas e só para os ids realmente usados — o
   * mesmo padrão aplicado em UserService.getAll depois de medir que
   * relação "muitos" aninhada mais de 1 nível vira subconsulta JSON
   * correlacionada lenta no MySQL (ver relationJoins).
   */
  private async getCandidatosNoIntervalo(inicio: string, fim: string) {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.calendario.findMany({
      select: {
        id: true,
        start: true,
        end: true,
        dataInicio: true,
        dataFim: true,
        diasFrequencia: true,
        exdate: true,
        intervaloId: true,
        frequenciaId: true,
        terapeutaId: true,
        pacienteId: true,
        especialidadeId: true,
        funcaoId: true,
        localidadeId: true,
        statusEventosId: true,
      },
      where: buildDateRangeWhere(inicio, fim),
    });
  }

  /** Todas as datas de ocorrência de um evento (candidato) dentro de [inicio, fim]. */
  private ocorrenciasNoIntervalo(
    evento: any,
    inicio: string,
    fim: string,
  ): string[] {
    if (Number(evento.frequenciaId) === 1) {
      return evento.dataInicio >= inicio && evento.dataInicio <= fim
        ? [evento.dataInicio]
        : [];
    }

    const dias = evento.diasFrequencia
      ? evento.diasFrequencia.split(',').filter(Boolean)
      : [];
    const exdate = evento.exdate
      ? evento.exdate.split(',').filter(Boolean)
      : [];
    // Sem dataFim (recorrência indefinida) e sem horizonte pedido pela
    // agenda de verdade aqui — só precisamos saber se toca [inicio, fim],
    // então o próprio `fim` já serve de teto pra expansão.
    const fimEfetivo =
      evento.dataFim && evento.dataFim < fim ? evento.dataFim : fim;

    return getDates(
      dias,
      evento.dataInicio,
      fimEfetivo,
      Number(evento.intervaloId) || 1,
      exdate,
    ).filter((data) => data >= inicio && data <= fim);
  }

  /**
   * Eventos que ocorrem dentro de [inicio, fim] — uma linha por
   * OCORRÊNCIA, não por evento (uma série recorrente que bate 2x na
   * semana entra 2x na contagem, corretamente). Pra um único dia
   * (inicio === fim) equivale, na prática, a 1 linha por evento — é o
   * caso usado pelos painéis que continuam estritamente "hoje".
   */
  private async getEventosNoIntervalo(inicio: string, fim: string) {
    const candidatos = await this.getCandidatosNoIntervalo(inicio, fim);
    const linhas: any[] = [];

    candidatos.forEach((evento) => {
      const ocorrencias = this.ocorrenciasNoIntervalo(evento, inicio, fim);
      ocorrencias.forEach((dataOcorrencia) => linhas.push({ ...evento, dataOcorrencia }));
    });

    return linhas;
  }

  private async getEventosDoDia(dataISO: string) {
    return this.getEventosNoIntervalo(dataISO, dataISO);
  }

  // ---------------------------------------------------------------------
  // Lookups simples em lote — nunca relação aninhada, sempre `id: {in}`
  // ---------------------------------------------------------------------

  private async mapaDeNomes(
    model: string,
    ids: number[],
    campos: string[] = ['nome'],
  ): Promise<Map<number, any>> {
    const idsUnicos = [...new Set(ids)].filter((id) => typeof id === 'number');

    if (!idsUnicos.length) {
      return new Map();
    }

    const prisma: any = getPrismaClient(this.prismaService);
    const select = campos.reduce(
      (acc, campo) => ({ ...acc, [campo]: true }),
      { id: true },
    );

    const linhas = await prisma[model].findMany({
      where: { id: { in: idsUnicos } },
      select,
    });

    return new Map(linhas.map((linha: any) => [linha.id, linha]));
  }

  private async mapaStatusEventos(): Promise<Map<number, { nome: string; cobrar: boolean }>> {
    const prisma = getPrismaClient(this.prismaService);

    const linhas = await prisma.statusEventos.findMany({
      select: { id: true, nome: true, cobrar: true },
    });

    return new Map(linhas.map((s) => [s.id, { nome: s.nome.trim(), cobrar: s.cobrar }]));
  }

  private classificarStatus(nome: string) {
    const lower = (nome || '').toLowerCase();
    return {
      atendido: lower.includes('atendido'),
      falta: lower.includes('falta'),
      confirmado: lower.includes('confirmado'),
      cancelado: lower.includes('cancelado'),
      avisar: lower.includes('avisar'),
    };
  }

  private calcularTaxaPresenca(eventos: any[], statusMap: Map<number, any>) {
    let atendidos = 0;
    let faltas = 0;

    eventos.forEach((evento) => {
      const nome = statusMap.get(evento.statusEventosId)?.nome || '';
      const classe = this.classificarStatus(nome);
      if (classe.atendido) atendidos += 1;
      if (classe.falta) faltas += 1;
    });

    const base = atendidos + faltas;
    return base ? Math.round((atendidos / base) * 100) : null;
  }

  // ---------------------------------------------------------------------
  // Endpoints
  // ---------------------------------------------------------------------

  /**
   * `periodo` muda o quê aqui: sessões contadas e taxa de presença passam
   * a olhar o intervalo inteiro (não só hoje), e os deltas comparam com o
   * trecho equivalente anterior (ontem / semana passada / mês passado).
   * `pacientesAtivos` e `filaEspera` continuam sendo uma contagem *atual*
   * (não tem como ter sido diferente "na semana passada" sem um
   * snapshot histórico que não existe) — só o delta muda de janela.
   */
  async getResumo(periodo: Periodo = 'hoje') {
    const prisma = getPrismaClient(this.prismaService);
    const { inicio, fim, inicioAnterior, fimAnterior } = this.resolverIntervalo(periodo);

    const [
      eventosPeriodo,
      eventosAnterior,
      statusMap,
      pacientesAtivos,
      novosNoPeriodo,
      filaEspera,
      entraramNoPeriodo,
      sairamNoPeriodo,
    ] = await Promise.all([
      this.getEventosNoIntervalo(inicio, fim),
      this.getEventosNoIntervalo(inicioAnterior, fimAnterior),
      this.mapaStatusEventos(),
      prisma.paciente.count({ where: { disabled: false } }),
      prisma.paciente.count({
        where: { disabled: false, createdAt: { gte: new Date(`${inicio}T00:00:00`) } },
      }),
      prisma.vaga.count({ where: { naFila: true } }),
      prisma.vaga.count({ where: { dataContato: { gte: inicio, lte: fim } } }),
      prisma.vaga.count({ where: { dataSaiuFila: { gte: inicio, lte: fim } } }),
    ]);

    const taxaPresencaPeriodo = this.calcularTaxaPresenca(eventosPeriodo, statusMap);
    const taxaPresencaAnterior = this.calcularTaxaPresenca(eventosAnterior, statusMap);
    const rotulo = ROTULO_PERIODO[periodo];
    const rotuloAnterior = ROTULO_PERIODO_ANTERIOR[periodo];

    return {
      pacientesAtivos: {
        valor: pacientesAtivos,
        // Não existe histórico diário de quantos pacientes estavam ativos
        // "ontem"/"semana passada" — aproximação honesta: novos cadastros
        // ativos dentro do período selecionado.
        deltaDescricao: `+${novosNoPeriodo} ${rotulo}`,
      },
      // Nome do campo mantido (`sessoesHoje`) mesmo passando a representar
      // "sessões no período" — o front já consome essa chave, renomear
      // quebraria o binding existente sem necessidade.
      sessoesHoje: {
        valor: eventosPeriodo.length,
        deltaDescricao: `${eventosPeriodo.length - eventosAnterior.length >= 0 ? '+' : ''}${
          eventosPeriodo.length - eventosAnterior.length
        } vs ${rotuloAnterior}`,
      },
      filaEspera: {
        valor: filaEspera,
        // Sem snapshot histórico de fila: aproximação = quem entrou menos
        // quem saiu dentro do período (Vaga.dataContato / dataSaiuFila).
        deltaDescricao: `${entraramNoPeriodo - sairamNoPeriodo >= 0 ? '+' : ''}${
          entraramNoPeriodo - sairamNoPeriodo
        } ${rotulo}`,
      },
      taxaPresenca: {
        valor: taxaPresencaPeriodo,
        deltaDescricao:
          taxaPresencaPeriodo !== null && taxaPresencaAnterior !== null
            ? `${taxaPresencaPeriodo - taxaPresencaAnterior >= 0 ? '+' : ''}${
                taxaPresencaPeriodo - taxaPresencaAnterior
              }% vs ${rotuloAnterior}`
            : 'sem sessões suficientes pra comparar',
      },
    };
  }

  /**
   * Sessões REALIZADAS dentro do período, agrupadas por especialidade —
   * substitui o "sessões x meta semanal" do mockup original (meta não é
   * um dado do sistema; decisão tomada com o usuário).
   */
  async getSessoesPorEspecialidade(periodo: Periodo = 'hoje') {
    const { inicio, fim } = this.resolverIntervalo(periodo);

    const [candidatos, statusMap] = await Promise.all([
      this.getCandidatosNoIntervalo(inicio, fim),
      this.mapaStatusEventos(),
    ]);

    const contagemPorEspecialidade = new Map<number, number>();

    candidatos.forEach((evento) => {
      const nomeStatus = statusMap.get(evento.statusEventosId)?.nome || '';
      if (!this.classificarStatus(nomeStatus).atendido) {
        return;
      }

      const ocorrencias = this.ocorrenciasNoIntervalo(evento, inicio, fim);
      if (!ocorrencias.length) {
        return;
      }

      contagemPorEspecialidade.set(
        evento.especialidadeId,
        (contagemPorEspecialidade.get(evento.especialidadeId) || 0) + ocorrencias.length,
      );
    });

    const especialidades = await this.mapaDeNomes(
      'especialidade',
      [...contagemPorEspecialidade.keys()],
      ['nome', 'cor'],
    );

    return [...contagemPorEspecialidade.entries()]
      .map(([especialidadeId, quantidade]) => ({
        especialidadeId,
        nome: especialidades.get(especialidadeId)?.nome || 'Sem especialidade',
        cor: especialidades.get(especialidadeId)?.cor || '#94a3b8',
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  async getSessoesPorStatus(periodo: Periodo = 'hoje') {
    const { inicio, fim } = this.resolverIntervalo(periodo);
    const [eventos, statusMap] = await Promise.all([
      this.getEventosNoIntervalo(inicio, fim),
      this.mapaStatusEventos(),
    ]);

    const contagem = new Map<number, number>();
    eventos.forEach((evento) => {
      contagem.set(
        evento.statusEventosId,
        (contagem.get(evento.statusEventosId) || 0) + 1,
      );
    });

    const total = eventos.length;

    return [...contagem.entries()]
      .map(([statusEventosId, quantidade]) => ({
        statusEventosId,
        nome: statusMap.get(statusEventosId)?.nome || 'Sem status',
        quantidade,
        percentual: total ? Math.round((quantidade / total) * 100) : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  /**
   * Distribuição das sessões do período por período do dia (manhã/tarde/
   * noite), em % do total — não contra "capacidade" (decisão do usuário:
   * mostrar em que período as sessões costumam acontecer, não ocupação
   * vs jornada cadastrada).
   */
  async getOcupacaoPorPeriodo(periodo: Periodo = 'hoje') {
    const { inicio, fim } = this.resolverIntervalo(periodo);
    const eventos = await this.getEventosNoIntervalo(inicio, fim);

    const periodos = { manha: 0, tarde: 0, noite: 0 };

    eventos.forEach((evento) => {
      const hora = evento.start || '00:00';
      if (hora < '12:00') periodos.manha += 1;
      else if (hora < '18:00') periodos.tarde += 1;
      else periodos.noite += 1;
    });

    const total = eventos.length;
    const paraPercentual = (quantidade: number) =>
      total ? Math.round((quantidade / total) * 100) : 0;

    return [
      { periodo: 'Manhã', quantidade: periodos.manha, percentual: paraPercentual(periodos.manha) },
      { periodo: 'Tarde', quantidade: periodos.tarde, percentual: paraPercentual(periodos.tarde) },
      { periodo: 'Noite', quantidade: periodos.noite, percentual: paraPercentual(periodos.noite) },
    ];
  }

  /**
   * Estado ATUAL de cada estágio do funil (quantos pacientes estão em
   * cada um agora) — não é um evento datado (não existe "quando o
   * paciente entrou nesse estágio" registrado), então `periodo` é
   * aceito só por consistência de assinatura com o resto do dashboard e
   * ignorado de propósito. Ver conversa: decisão explícita de não
   * reinterpretar isso como "novos cadastros no período", que seria uma
   * métrica diferente (aquisição, não pipeline atual).
   */
  async getFluxoPacientes(_periodo: Periodo = 'hoje') {
    const prisma = getPrismaClient(this.prismaService);

    const contagens = await Promise.all(
      ESTAGIOS_FUNIL.map((estagio) =>
        prisma.paciente.count({
          where: { disabled: false, statusPacienteCod: estagio.cod },
        }),
      ),
    );

    return ESTAGIOS_FUNIL.map((estagio, index) => ({
      cod: estagio.cod,
      nome: estagio.nome,
      quantidade: contagens[index],
    }));
  }

  /**
   * Fila de espera ATUAL por especialidade — mesmo caso de
   * `getFluxoPacientes`: `Vaga.naFila` é um estado de agora, não um
   * evento com data pra filtrar por período. `periodo` aceito e ignorado
   * de propósito.
   */
  async getFilaPorEspecialidade(_periodo: Periodo = 'hoje') {
    const prisma = getPrismaClient(this.prismaService);

    const vagasNaFila = await prisma.vaga.findMany({
      where: { naFila: true },
      select: { id: true },
    });

    if (!vagasNaFila.length) {
      return [];
    }

    const vinculos = await prisma.vagaOnEspecialidade.findMany({
      where: { vagaId: { in: vagasNaFila.map((v) => v.id) } },
      select: { especialidadeId: true },
    });

    const contagem = new Map<number, number>();
    vinculos.forEach((vinculo) => {
      contagem.set(
        vinculo.especialidadeId,
        (contagem.get(vinculo.especialidadeId) || 0) + 1,
      );
    });

    const especialidades = await this.mapaDeNomes(
      'especialidade',
      [...contagem.keys()],
      ['nome', 'cor'],
    );

    return [...contagem.entries()]
      .map(([especialidadeId, quantidade]) => ({
        especialidadeId,
        nome: especialidades.get(especialidadeId)?.nome || 'Sem especialidade',
        cor: especialidades.get(especialidadeId)?.cor || '#94a3b8',
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  /**
   * "Avisar hoje" e "conflito de agenda" continuam estritamente hoje —
   * são sobre a agenda de HOJE, período não muda o sentido deles. Só
   * "evolução pendente" passa a olhar o período inteiro (sessão atendida
   * sem evolução lançada continua pendente amanhã, faz sentido enxergar
   * o acumulado da semana/mês, não só do dia).
   */
  async getPendencias(periodo: Periodo = 'hoje') {
    const prisma = getPrismaClient(this.prismaService);
    const hoje = dateFormatYYYYMMDD(new Date());
    const { inicio, fim } = this.resolverIntervalo(periodo);

    const [eventosHoje, eventosPeriodo, statusMap] = await Promise.all([
      this.getEventosDoDia(hoje),
      this.getEventosNoIntervalo(inicio, fim),
      this.mapaStatusEventos(),
    ]);

    const idsAvisar = eventosHoje
      .filter((evento) => this.classificarStatus(statusMap.get(evento.statusEventosId)?.nome || '').avisar)
      .map((evento) => evento.id);

    const idsAtendidosNoPeriodo = eventosPeriodo
      .filter((evento) => this.classificarStatus(statusMap.get(evento.statusEventosId)?.nome || '').atendido)
      .map((evento) => evento.id);

    const comEvolucao = idsAtendidosNoPeriodo.length
      ? await prisma.atividadeSessao.findMany({
          where: { calendarioId: { in: idsAtendidosNoPeriodo } },
          select: { calendarioId: true },
        })
      : [];
    const idsComEvolucao = new Set(comEvolucao.map((a) => a.calendarioId));
    const semEvolucao = idsAtendidosNoPeriodo.filter((id) => !idsComEvolucao.has(id));

    const conflitos = this.contarConflitosDeHorario(eventosHoje, statusMap);
    const rotulo = ROTULO_PERIODO[periodo];

    const pendencias = [
      {
        tipo: 'avisar',
        quantidade: idsAvisar.length,
        descricao: 'Eventos marcados para avisar hoje',
      },
      {
        tipo: 'evolucao_pendente',
        quantidade: semEvolucao.length,
        descricao: `Sessões atendidas sem evolução lançada (${rotulo})`,
      },
      {
        tipo: 'conflito_agenda',
        quantidade: conflitos,
        descricao: 'Conflitos de horário na agenda de hoje',
      },
    ];

    return pendencias.filter((pendencia) => pendencia.quantidade > 0);
  }

  private contarConflitosDeHorario(eventos: any[], statusMap: Map<number, any>) {
    const porTerapeuta = new Map<number, any[]>();

    eventos.forEach((evento) => {
      const nomeStatus = statusMap.get(evento.statusEventosId)?.nome || '';
      if (this.classificarStatus(nomeStatus).cancelado) {
        return;
      }
      const lista = porTerapeuta.get(evento.terapeutaId) || [];
      lista.push(evento);
      porTerapeuta.set(evento.terapeutaId, lista);
    });

    let conflitos = 0;

    porTerapeuta.forEach((lista) => {
      const ordenada = [...lista].sort((a, b) => (a.start > b.start ? 1 : -1));
      for (let i = 1; i < ordenada.length; i += 1) {
        const anterior = ordenada[i - 1];
        const atual = ordenada[i];
        if (anterior.end && atual.start < anterior.end) {
          conflitos += 1;
        }
      }
    });

    return conflitos;
  }

  /**
   * "Próximas sessões de hoje" — é uma lista do que vem a seguir HOJE;
   * não tem uma versão "semanal" com o mesmo sentido (a agenda em si já
   * cobre isso). `periodo` aceito e ignorado de propósito.
   */
  async getSessoesHoje(_periodo: Periodo = 'hoje') {
    const hoje = dateFormatYYYYMMDD(new Date());
    const [eventosHoje, statusMap] = await Promise.all([
      this.getEventosDoDia(hoje),
      this.mapaStatusEventos(),
    ]);

    const [pacientes, terapeutas, especialidades, funcoes, localidades] = await Promise.all([
      this.mapaDeNomes('paciente', eventosHoje.map((e) => e.pacienteId)),
      this.mapaDeNomes('usuario', eventosHoje.map((e) => e.terapeutaId)),
      this.mapaDeNomes('especialidade', eventosHoje.map((e) => e.especialidadeId)),
      this.mapaDeNomes('funcao', eventosHoje.map((e) => e.funcaoId)),
      this.mapaDeNomes('localidade', eventosHoje.map((e) => e.localidadeId), ['casa', 'sala']),
    ]);

    return eventosHoje
      .sort((a, b) => (a.start > b.start ? 1 : -1))
      .map((evento) => {
        const localidade = localidades.get(evento.localidadeId);
        return {
          id: evento.id,
          horario: evento.start,
          paciente: pacientes.get(evento.pacienteId)?.nome || '-',
          especialidade: especialidades.get(evento.especialidadeId)?.nome || '-',
          funcao: funcoes.get(evento.funcaoId)?.nome || '-',
          profissional: terapeutas.get(evento.terapeutaId)?.nome || '-',
          sala: localidade ? `${localidade.casa} — ${localidade.sala}` : '-',
          status: statusMap.get(evento.statusEventosId)?.nome || '-',
        };
      });
  }

  /**
   * Ranking de terapeutas dentro do período (não só hoje — estendido em
   * relação à primeira versão porque o custo de generalizar era baixo e
   * "top terapeutas da semana/mês" é uma leitura genuinamente útil).
   */
  async getTopTerapeutas(periodo: Periodo = 'hoje', limite = 5) {
    const { inicio, fim } = this.resolverIntervalo(periodo);
    const [eventos, statusMap] = await Promise.all([
      this.getEventosNoIntervalo(inicio, fim),
      this.mapaStatusEventos(),
    ]);

    const porTerapeuta = new Map<number, { sessoes: number; atendidos: number }>();

    eventos.forEach((evento) => {
      const atual = porTerapeuta.get(evento.terapeutaId) || { sessoes: 0, atendidos: 0 };
      atual.sessoes += 1;
      if (this.classificarStatus(statusMap.get(evento.statusEventosId)?.nome || '').atendido) {
        atual.atendidos += 1;
      }
      porTerapeuta.set(evento.terapeutaId, atual);
    });

    const terapeutas = await this.mapaDeNomes('usuario', [...porTerapeuta.keys()]);

    return [...porTerapeuta.entries()]
      .map(([terapeutaId, dados]) => ({
        terapeutaId,
        nome: terapeutas.get(terapeutaId)?.nome || '-',
        sessoes: dados.sessoes,
        presencaPercentual: Math.round((dados.atendidos / dados.sessoes) * 100),
      }))
      .sort((a, b) => b.sessoes - a.sessoes)
      .slice(0, limite);
  }
}
