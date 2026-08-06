import { Injectable } from '@nestjs/common';
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

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  // ---------------------------------------------------------------------
  // Núcleo compartilhado: ocorrências de Calendario num intervalo de datas
  // ---------------------------------------------------------------------

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

  /** Eventos que ocorrem exatamente no dia informado (YYYY-MM-DD). */
  private async getEventosDoDia(dataISO: string) {
    const candidatos = await this.getCandidatosNoIntervalo(dataISO, dataISO);

    return candidatos.filter(
      (evento) => this.ocorrenciasNoIntervalo(evento, dataISO, dataISO).length > 0,
    );
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

  async getResumo() {
    const prisma = getPrismaClient(this.prismaService);

    const hoje = dateFormatYYYYMMDD(new Date());
    const ontem = dateSubtractDay(hoje, 1);

    const [eventosHoje, eventosOntem, statusMap, pacientesAtivos, novosHoje, filaEspera, entraramHoje, sairamHoje] =
      await Promise.all([
        this.getEventosDoDia(hoje),
        this.getEventosDoDia(ontem),
        this.mapaStatusEventos(),
        prisma.paciente.count({ where: { disabled: false } }),
        prisma.paciente.count({
          where: { disabled: false, createdAt: { gte: new Date(`${hoje}T00:00:00`) } },
        }),
        prisma.vaga.count({ where: { naFila: true } }),
        prisma.vaga.count({ where: { dataContato: hoje } }),
        prisma.vaga.count({ where: { dataSaiuFila: hoje } }),
      ]);

    const taxaPresencaHoje = this.calcularTaxaPresenca(eventosHoje, statusMap);
    const taxaPresencaOntem = this.calcularTaxaPresenca(eventosOntem, statusMap);

    return {
      pacientesAtivos: {
        valor: pacientesAtivos,
        // Não existe histórico diário de quantos pacientes estavam ativos
        // "ontem" — aproximação honesta: novos cadastros ativos hoje.
        deltaDescricao: `+${novosHoje} hoje`,
      },
      sessoesHoje: {
        valor: eventosHoje.length,
        deltaDescricao: `${eventosHoje.length - eventosOntem.length >= 0 ? '+' : ''}${
          eventosHoje.length - eventosOntem.length
        } desde ontem`,
      },
      filaEspera: {
        valor: filaEspera,
        // Sem snapshot diário de fila: aproximação = quem entrou hoje
        // menos quem saiu hoje (Vaga.dataContato / Vaga.dataSaiuFila).
        deltaDescricao: `${entraramHoje - sairamHoje >= 0 ? '+' : ''}${
          entraramHoje - sairamHoje
        } hoje`,
      },
      taxaPresenca: {
        valor: taxaPresencaHoje,
        deltaDescricao:
          taxaPresencaHoje !== null && taxaPresencaOntem !== null
            ? `${taxaPresencaHoje - taxaPresencaOntem >= 0 ? '+' : ''}${
                taxaPresencaHoje - taxaPresencaOntem
              }% vs ontem`
            : 'sem sessões suficientes pra comparar',
      },
    };
  }

  /**
   * Substitui o "sessões x meta semanal" do mockup original (meta não é
   * um dado do sistema) por sessões REALIZADAS na semana atual, agrupadas
   * por especialidade — decisão tomada com o usuário.
   */
  async getSessoesPorEspecialidade() {
    const prisma = getPrismaClient(this.prismaService);

    const hoje = dateFormatYYYYMMDD(new Date());
    const diaSemanaIso = new Date(`${hoje}T00:00:00`).getDay() || 7; // 1-7, domingo=7
    const inicioSemana = dateSubtractDay(hoje, diaSemanaIso - 1);

    const [candidatos, statusMap] = await Promise.all([
      this.getCandidatosNoIntervalo(inicioSemana, hoje),
      this.mapaStatusEventos(),
    ]);

    const contagemPorEspecialidade = new Map<number, number>();

    candidatos.forEach((evento) => {
      const nomeStatus = statusMap.get(evento.statusEventosId)?.nome || '';
      if (!this.classificarStatus(nomeStatus).atendido) {
        return;
      }

      const ocorrencias = this.ocorrenciasNoIntervalo(evento, inicioSemana, hoje);
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

  async getSessoesPorStatus() {
    const hoje = dateFormatYYYYMMDD(new Date());
    const [eventosHoje, statusMap] = await Promise.all([
      this.getEventosDoDia(hoje),
      this.mapaStatusEventos(),
    ]);

    const contagem = new Map<number, number>();
    eventosHoje.forEach((evento) => {
      contagem.set(
        evento.statusEventosId,
        (contagem.get(evento.statusEventosId) || 0) + 1,
      );
    });

    const total = eventosHoje.length;

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
   * Distribuição das sessões de hoje por período do dia (manhã/tarde/
   * noite), em % do total de sessões de hoje — não contra "capacidade"
   * (decisão do usuário: mostrar em que período as sessões costumam
   * acontecer, não ocupação vs jornada cadastrada).
   */
  async getOcupacaoPorPeriodo() {
    const hoje = dateFormatYYYYMMDD(new Date());
    const eventosHoje = await this.getEventosDoDia(hoje);

    const periodos = { manha: 0, tarde: 0, noite: 0 };

    eventosHoje.forEach((evento) => {
      const hora = evento.start || '00:00';
      if (hora < '12:00') periodos.manha += 1;
      else if (hora < '18:00') periodos.tarde += 1;
      else periodos.noite += 1;
    });

    const total = eventosHoje.length;
    const paraPercentual = (quantidade: number) =>
      total ? Math.round((quantidade / total) * 100) : 0;

    return [
      { periodo: 'Manhã', quantidade: periodos.manha, percentual: paraPercentual(periodos.manha) },
      { periodo: 'Tarde', quantidade: periodos.tarde, percentual: paraPercentual(periodos.tarde) },
      { periodo: 'Noite', quantidade: periodos.noite, percentual: paraPercentual(periodos.noite) },
    ];
  }

  async getFluxoPacientes() {
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

  async getFilaPorEspecialidade() {
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

    const especialidades = await this.mapaDeNomes('especialidade', [...contagem.keys()]);

    return [...contagem.entries()]
      .map(([especialidadeId, quantidade]) => ({
        especialidadeId,
        nome: especialidades.get(especialidadeId)?.nome || 'Sem especialidade',
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  /**
   * Pendências com fonte de dado real (o mockup original também tinha
   * "documentação pendente" e "contratos vencendo" — não existem no
   * schema, não foram incluídos; ver conversa).
   */
  async getPendencias() {
    const prisma = getPrismaClient(this.prismaService);
    const hoje = dateFormatYYYYMMDD(new Date());

    const [eventosHoje, statusMap] = await Promise.all([
      this.getEventosDoDia(hoje),
      this.mapaStatusEventos(),
    ]);

    const idsAvisar = eventosHoje
      .filter((evento) => this.classificarStatus(statusMap.get(evento.statusEventosId)?.nome || '').avisar)
      .map((evento) => evento.id);

    const idsAtendidos = eventosHoje
      .filter((evento) => this.classificarStatus(statusMap.get(evento.statusEventosId)?.nome || '').atendido)
      .map((evento) => evento.id);

    const comEvolucao = idsAtendidos.length
      ? await prisma.atividadeSessao.findMany({
          where: { calendarioId: { in: idsAtendidos } },
          select: { calendarioId: true },
        })
      : [];
    const idsComEvolucao = new Set(comEvolucao.map((a) => a.calendarioId));
    const semEvolucao = idsAtendidos.filter((id) => !idsComEvolucao.has(id));

    const conflitos = this.contarConflitosDeHorario(eventosHoje, statusMap);

    const pendencias = [
      {
        tipo: 'avisar',
        quantidade: idsAvisar.length,
        descricao: 'Eventos marcados para avisar hoje',
      },
      {
        tipo: 'evolucao_pendente',
        quantidade: semEvolucao.length,
        descricao: 'Sessões atendidas hoje sem evolução lançada',
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

  async getSessoesHoje() {
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

  async getTopTerapeutas(limite = 5) {
    const hoje = dateFormatYYYYMMDD(new Date());
    const [eventosHoje, statusMap] = await Promise.all([
      this.getEventosDoDia(hoje),
      this.mapaStatusEventos(),
    ]);

    const porTerapeuta = new Map<number, { sessoes: number; atendidos: number }>();

    eventosHoje.forEach((evento) => {
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
