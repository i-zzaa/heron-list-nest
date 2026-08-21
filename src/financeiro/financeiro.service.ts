import { Injectable } from '@nestjs/common';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  dateBetween,
  formaTime,
  formatDateTime,
  getDatesWhiteEvents,
} from 'src/util/format-date';
import {
  FinancialPaciente,
  FinancialPacienteProps,
  FinancialProps,
  FinancialTerapeuta,
  FinancialTerapeutaProps,
} from './financeiro.interface';
import * as moment from 'moment';
import { readDecimal } from 'src/util/normalizers';
// Movido para um módulo à parte (src/util/financeiro-config.ts) porque
// agenda.service.ts também precisa dessas mesmas constantes pra gravar o
// snapshot financeiro do evento (R17) — e agenda.service.ts é importado por
// este arquivo, então importar na direção contrária criaria um ciclo. As
// duas constantes locais que existiam aqui (definidas do mesmo jeito) foram
// removidas para não haver duas fontes da verdade.
import { VALOR_POR_KM, VALOR_SESSAO_DEVOLUTIVA } from 'src/util/financeiro-config';

@Injectable()
export class FinanceiroService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  private async expandEvents(eventosBrutos: any[], dataFim: string) {
    const eventos: any[] = [];

    await Promise.all(
      eventosBrutos.map((event: any) => {
        const dataFimParam = event?.dataFim || dataFim;
        const diasFrequencia = event?.diasFrequencia
          ? event.diasFrequencia.split(',')
          : [];

        const newEvents = getDatesWhiteEvents(
          diasFrequencia,
          event?.dataInicio,
          dataFimParam,
          event?.intervalo?.id || 1,
          event,
        );

        eventos.push(...newEvents);
      }),
    );

    return eventos;
  }

  /**
   * Item 2 dos "pontos menores" (heron-list-web): total por grupo do
   * accordion (por terapeuta em paciente(), por paciente em terapeuta())
   * era somado no cliente (Financial.tsx: reducerValorTotal/
   * reducerHorasTotal), iterando o array de cada grupo a cada render.
   * Aditivo — `data` continua exatamente como está (array por grupo, o
   * front não precisa mudar como renderiza a tabela); isso só acrescenta
   * o total já pronto por chave, pra tela usar em vez de recalcular.
   */
  private calcularTotaisPorGrupo(
    grupos: Record<string, Array<{ valorTotal?: number; horas?: string }>>,
  ) {
    return Object.fromEntries(
      Object.entries(grupos).map(([chave, itens]) => {
        const valorTotal = itens.reduce(
          (acc, item) => acc + (item.valorTotal || 0),
          0,
        );
        const horas = itens.reduce(
          (acc, item) => acc.add(moment.duration(item.horas || '00:00:00')),
          moment.duration(0),
        );

        return [chave, { valorTotal, horas: formaTime(horas) }];
      }),
    );
  }

  private shouldSkipEvent(
    evento: any,
    dataFim: string,
    dataInicio: string,
    statusEventosId?: number,
  ) {
    const exdate = evento?.exdate ? evento.exdate.split(',') : [];
    const statusEventos = evento?.statusEventos || {};
    const statusCobrar = Boolean(statusEventos?.cobrar);
    const statusNome = statusEventos?.nome || 'Status não informado';
    const eventoDataInicio = evento?.dataInicio || '';

    const skip =
      exdate.includes(eventoDataInicio) ||
      !dateBetween(eventoDataInicio, dataFim, dataInicio) ||
      (statusEventosId && statusEventos?.id != statusEventosId);

    return { skip, statusCobrar, statusNome };
  }

  async paciente(body: FinancialProps) {
    // filtra eventos por terapeuta no peridodo
    // filtra statusEventos cobrados
    // agrupa por paciente

    const { pacienteId, dataFim: dataFimBody, dataInicio, statusEventosId } = body;
    const dataFim = dataFimBody || dataInicio;

    const eventosBrutos = await this.agendaService.getFilterFinancialPaciente({
      pacienteId,
      dataFim,
      dataInicio,
    });

    if (!eventosBrutos.length)
      return {
        data: [],
        valorTotal: 0,
        paciente: '',
        valorKm: 0,
      };

    const eventos = await this.expandEvents(eventosBrutos, dataFim);

    if (!eventos.length)
      return {
        data: [],
        valorTotal: 0,
        paciente: '',
        valorKm: 0,
      };

    const relatorio: FinancialPacienteProps[] = [];
    let paciente;

    let valorTotal = 0;
    let valorKm = 0;
    let horas = moment.duration(0);

    const especialidadeTimeSessions: any = {};

    await Promise.all(
      eventos.map((evento: any) => {
        const exdate = evento?.exdate ? evento.exdate.split(',') : [];
        const statusEventos = evento?.statusEventos || {};
        const statusCobrar = Boolean(statusEventos?.cobrar);
        const statusNome = statusEventos?.nome || 'Status não informado';

        if (
          exdate.includes(evento.dataInicio) ||
          !dateBetween(evento.dataInicio, dataFim, dataInicio) ||
          (statusEventosId && statusEventos?.id != statusEventosId)
        ) {
          return;
        }

        const especialidadesPaciente =
          evento.paciente?.vaga?.especialidades || [];
        const sessao = especialidadesPaciente.filter(
          (especialidadePaciente: any) =>
            especialidadePaciente.especialidadeId === evento.especialidade?.id,
        )[0];

        // Snapshot financeiro (R17): se o evento já tem valor congelado no
        // momento em que foi criado/editado, usa ele — só cai pro valor
        // *atual* do cadastro (`sessao.valor`) para eventos antigos sem
        // snapshot (não deveria acontecer depois da migration de backfill,
        // mas fica como rede de segurança).
        const sessaoValor =
          evento.valorSessaoSnapshot != null
            ? readDecimal(evento.valorSessaoSnapshot)
            : sessao?.valor
            ? readDecimal(sessao.valor)
            : 0;

        if (!sessao && !evento.especialidade?.id) {
          return;
        }

        paciente = evento.paciente?.nome || 'Paciente não informado';
        const especialidadeNome =
          evento.especialidade?.nome || 'Especialidade não informada';

        const start = evento.start
          ? formatDateTime(evento.start, evento.dataInicio)
          : null;
        const end = evento.end
          ? formatDateTime(evento.end, evento.dataInicio)
          : null;

        const diff =
          start && end
            ? moment(end, 'YYYY-MM-DD HH:mm').diff(
                moment(start, 'YYYY-MM-DD HH:mm'),
              )
            : 0;
        const horasEvento = moment.duration(diff || 0);

        const duracaoTotal = moment.duration(
          especialidadeTimeSessions[especialidadeNome] || 0,
        );
        const duracaoEspecialidadeSessaoTotal = duracaoTotal.add(horasEvento);

        especialidadeTimeSessions[especialidadeNome] =
          statusCobrar && formaTime(duracaoEspecialidadeSessaoTotal);

        // console.log(evento.km);

        const financeiro = new FinancialPaciente({
          paciente: evento.paciente?.nome || 'Paciente não informado',
          terapeuta:
            evento.terapeuta?.usuario?.nome || 'Terapeuta não informado',
          data: moment(evento.dataInicio).format('DD/MM/YYYY'),
          sessao: statusCobrar ? sessaoValor : 0,
          km: !!evento.km ? parseFloat(evento.km) : 0,
          status: statusNome,
          valorSessao: statusCobrar ? sessaoValor : 0,
          funcao: evento.funcao?.nome || 'Função não informada',
          valorTotal: statusCobrar ? sessaoValor : 0,
          horas: formaTime(horasEvento),
          especialidade: especialidadeNome,
        });

        if (!statusCobrar) {
          relatorio.push(financeiro);
          return;
        }

        relatorio.push({ ...financeiro });

        // valorTotal += parseFloat(sessao.valor);

        valorTotal += financeiro.valorTotal;
        horas = horas.add(horasEvento);
        valorKm += financeiro.km;

        return;
      }),
    );

    const terapeutasAgrupados: any = {};
    await Promise.all(
      relatorio.map((item: FinancialPacienteProps) => {
        if (!terapeutasAgrupados[item.terapeuta]) {
          terapeutasAgrupados[item.terapeuta] = [];
        }
        terapeutasAgrupados[item.terapeuta].push(item);
      }),
    );

    return {
      data: terapeutasAgrupados,
      // Item 2 dos "pontos menores": total por grupo (por terapeuta,
      // aqui) já pronto — data[chave] continua array, sem mudança.
      totaisPorGrupo: this.calcularTotaisPorGrupo(terapeutasAgrupados),
      nome: paciente,
      geral: {
        nome: paciente,
        valorTotal: valorTotal,
        horas: formaTime(horas),
        valorKm: valorKm,
        especialidadeSessoes: especialidadeTimeSessions,
      },
    };
  }

  async terapeuta(body: FinancialProps) {
    const { terapeutaId, dataFim: dataFimBody, dataInicio, statusEventosId } = body;
    const dataFim = dataFimBody || dataInicio;

    const eventosBrutos = await this.agendaService.getFilterFinancialTerapeuta({
      terapeutaId,
      dataFim,
      dataInicio,
    });

    console.log(eventosBrutos);

    if (!eventosBrutos.length) {
      return {
        data: [],
        valorTotal: 0,
        terapeuta: '',
      };
    }

    const eventos = await this.expandEvents(eventosBrutos, dataFim);

    if (!eventos.length)
      return {
        data: [],
        valorTotal: 0,
        terapeuta: '',
      };

    const relatorio: FinancialTerapeutaProps[] = [];
    let terapeuta;
    let valorTotal = 0;
    let valorKm = 0;
    let horas = moment.duration(0);
    let especialidade = '';

    await Promise.all(
      eventos.map((evento: any) => {
        const { skip, statusCobrar, statusNome } = this.shouldSkipEvent(
          evento,
          dataFim,
          dataInicio,
          statusEventosId,
        );

        if (skip) {
          return;
        }

        const especialidadesPaciente =
          evento.paciente?.vaga?.especialidades || [];
        const sessao = especialidadesPaciente.filter(
          (especialidadePaciente: any) =>
            especialidadePaciente.especialidadeId === evento.especialidade?.id,
        )[0];

        if (!sessao && !evento.especialidade?.id) {
          return;
        }
        const comissao = evento.terapeuta?.funcoes?.filter(
          (funcao: any) => funcao.funcaoId === evento.funcao?.id,
        )[0];

        // Snapshot financeiro (R17) — mesma lógica de preferência do método
        // `paciente()` acima, também para comissão e tipo de comissão.
        const sessaoValor =
          evento.valorSessaoSnapshot != null
            ? readDecimal(evento.valorSessaoSnapshot)
            : sessao?.valor
            ? readDecimal(sessao.valor)
            : 0;
        const comissaoValor =
          evento.comissaoSnapshot != null
            ? readDecimal(evento.comissaoSnapshot)
            : readDecimal(comissao?.comissao);
        const comissaoTipo = (
          evento.tipoComissaoSnapshot ||
          comissao?.tipo ||
          'fixo'
        ).toString();

        const isDevolutiva = evento.modalidade?.nome === 'Devolutiva';

        const especialidadeNome =
          evento.especialidade?.nome || 'Especialidade não informada';
        const start = evento.start
          ? formatDateTime(evento.start, evento.dataInicio)
          : null;
        const end = evento.end
          ? formatDateTime(evento.end, evento.dataInicio)
          : null;

        const diff =
          start && end
            ? moment(end, 'YYYY-MM-DD HH:mm').diff(
                moment(start, 'YYYY-MM-DD HH:mm'),
              )
            : 0;
        const horasEvento = moment.duration(diff || 0);

        terapeuta =
          evento.terapeuta?.usuario?.nome || 'Terapeuta não informado';
        especialidade = especialidadeNome;
        const financeiro = new FinancialTerapeuta({
          paciente: evento.paciente?.nome || 'Paciente não informado',
          terapeuta: terapeuta,
          data: moment(evento.dataInicio).format('DD/MM/YYYY'),
          sessao: sessaoValor,
          km: readDecimal(evento.km),
          comissao: comissaoValor,
          tipo: comissaoTipo,
          status: statusNome,
          devolutiva: isDevolutiva,
          horas: formaTime(horasEvento),
        });

        if (!statusCobrar) {
          financeiro.comissao = 0;
          financeiro.valorSessao = 0;
          financeiro.valorTotal = 0;
          financeiro.km = 0;

          relatorio.push(financeiro);
          return;
        }

        // Tarifa de devolutiva/km também respeita o snapshot, quando existe
        // — mesmo raciocínio: o valor vigente quando o evento foi
        // criado/editado, não o configurado hoje.
        const valorDevolutiva =
          evento.valorSessaoDevolutivaSnapshot != null
            ? readDecimal(evento.valorSessaoDevolutivaSnapshot)
            : VALOR_SESSAO_DEVOLUTIVA;
        const taxaPorKm =
          evento.valorPorKmSnapshot != null
            ? readDecimal(evento.valorPorKmSnapshot)
            : VALOR_POR_KM;

        if (isDevolutiva) {
          financeiro.valorSessao = valorDevolutiva;
          financeiro.valorTotal = valorDevolutiva;

          valorTotal += financeiro.valorTotal;
          horas = horas.add(horasEvento);

          relatorio.push(financeiro);

          return;
        }

        const valorKmEvento = readDecimal(evento.km) * taxaPorKm;
        let valorSessao = 0;

        switch (comissaoTipo.toLowerCase()) {
          case 'fixo':
            valorSessao = comissaoValor;
            break;
          default:
            valorSessao = sessaoValor * (comissaoValor / 100);
            break;
        }

        financeiro.valorKm = valorKmEvento;
        financeiro.valorSessao = valorSessao;
        financeiro.valorTotal = valorSessao + valorKmEvento;

        valorTotal += financeiro.valorTotal;
        valorKm += financeiro.valorKm;
        horas = horas.add(horasEvento);

        relatorio.push({ ...financeiro });

        return;
      }),
    );

    const pacientesAgrupados: any = {};
    await Promise.all(
      relatorio.map((item: FinancialTerapeutaProps) => {
        if (!pacientesAgrupados[item.paciente]) {
          pacientesAgrupados[item.paciente] = [];
        }
        pacientesAgrupados[item.paciente].push(item);
      }),
    );

    return {
      data: pacientesAgrupados,
      // Item 2 dos "pontos menores": total por grupo (por paciente, aqui)
      // já pronto — data[chave] continua array, sem mudança.
      totaisPorGrupo: this.calcularTotaisPorGrupo(pacientesAgrupados),
      nome: terapeuta,
      geral: {
        nome: terapeuta,
        valorTotal: valorTotal,
        horas: formaTime(horas),
        valorKm: valorKm,
        especialidade: especialidade,
      },
    };
  }
}
