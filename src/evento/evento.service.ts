import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { FrequenciaService } from 'src/frequencia/frequencia.service';
import { LocalidadeService } from 'src/localidade/localidade.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import {
  formatDateTime,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from 'src/utils/convert-hours';
import { ObjProps } from 'src/utils/interface.util';
import {
  CalendarioCreateParam,
  EventoServiceInterface,
  FilterFinancialTerapeutaProps,
} from './evento.interface';

@Injectable()
export class EventoService implements EventoServiceInterface {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly localidadeService: LocalidadeService,
    private readonly userService: UserService,
    private readonly frequenciaService: FrequenciaService,
  ) {}

  async getFilter(params: any, query: any) {
    const inicioDoMes = getPrimeiroDoMes(params.ano, params.mes);
    const ultimoDiaDoMes = getUltimoDoMes(params.ano, params.mes);

    const filter: any = {};
    Object.keys(query).map((key: string) => (filter[key] = Number(query[key])));

    const eventos = await this.prismaService.calendario.findMany({
      select: {
        id: true,
        // groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        exdate: true,

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
        statusEventos: {
          select: {
            nome: true,
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
      where: {
        ...filter,

        dataInicio: {
          lte: ultimoDiaDoMes, // menor que o ultimo dia do mes
        },
        OR: [
          {
            dataFim: '',
          },
          {
            dataFim: {
              // lte: ultimoDiaDoMes, // menor que o ultimo dia do mes
              gte: inicioDoMes, // maior que o primeiro dia do mes
            },
          },
        ],
        // pacienteId: Number(query?.pacientes),
        // statusEventosId: Number(query?.statusEventos),
      },
    });

    const eventosFormat = await this.formatEvents(eventos);
    return eventosFormat;
  }
  async createEvento(body: CalendarioCreateParam, login: string) {
    const user = await this.userService.getUser(login);
    const frequencia: ObjProps =
      body.frequencia === ''
        ? await this.frequenciaService.getFrequenciaName('Único')
        : body.frequencia;

    if (frequencia?.nome === 'Único') {
      body.dataFim = body.dataInicio;
      body.diasFrequencia = [];
      body.intervalo = {
        id: 1,
        nome: '1 Semana',
      };
    }

    const diasFrequencia = body.diasFrequencia.join(',');

    const evento = await this.prismaService.calendario.create({
      data: {
        groupId: 0,
        dataInicio: body.dataInicio,
        dataFim: body.dataFim,
        start: body.start,
        end: body.end,
        diasFrequencia: diasFrequencia,

        ciclo: 'ativo',
        observacao: body.observacao,
        pacienteId: body.paciente.id,
        modalidadeId: body.modalidade.id,
        especialidadeId: body.especialidade.id,
        terapeutaId: body.terapeuta.id,
        funcaoId: body.funcao.id,
        localidadeId: body.localidade.id,
        statusEventosId: body.statusEventos.id,
        frequenciaId: frequencia.id,
        intervaloId: body.intervalo.id,

        usuarioId: user.id,
      },
    });

    await this.prismaService.calendario.update({
      data: {
        groupId: evento.id,
      },
      where: {
        id: evento.id,
      },
    });

    return evento;
  }
  async updateEvento(body: any, login: string) {
    const dataFim = moment(body.dataAtual)
      .subtract(2, 'days')
      .format('YYYY-MM-DD');
    const isCanceled = body.statusEventos.nome === 'Cancelado';
    if (isCanceled && !body?.dataFim) {
      body.dataFim = dataFim;
    }

    const eventoUnico = await this.prismaService.calendario.findFirstOrThrow({
      where: {
        id: body.id,
      },
    });

    let evento;
    switch (true) {
      case body.frequencia.id === 1 && !body.changeAll:
        evento = await this.prismaService.calendario.updateMany({
          data: {
            dataInicio: body?.dataInicio,
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
            localidadeId: body?.localidade?.id,
            statusEventosId: body?.statusEventos?.id,
          },
          where: {
            id: body.id,
          },
        });
        break;
      case isCanceled && body.changeAll:
        evento = await this.prismaService.calendario.updateMany({
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
        evento = await this.prismaService.calendario.updateMany({
          data: {
            dataFim,
          },
          where: {
            groupId: body.groupId,
          },
        });

        await this.createEvento(
          {
            ...body,
            groupId: body.groupId,
            dataInicio: body.dataInicio,
          },
          login,
        );
        break;
      case body.changeAll && dataFim === eventoUnico.dataInicio:
        evento = await this.prismaService.calendario.updateMany({
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

        evento = await this.prismaService.calendario.updateMany({
          data: {
            exdate: format,
          },
          where: {
            id: body.id,
          },
        });

        await this.createEvento(
          {
            ...body,
            frequencia: '',
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
  async formatEvents(eventos: any) {
    const eventosFormat: any = [];
    eventos.map((evento: any) => {
      let formated: any = {};
      const cor =
        evento.statusEventos.nome === 'Cancelado'
          ? '#f87171'
          : evento.especialidade.cor;
      delete evento.especialidade.cor;

      evento.localidade = {
        nome: this.localidadeService.formatLocalidade(evento.localidade),
        id: evento.localidade.id,
      };

      evento.terapeuta = {
        nome: evento.terapeuta.usuario.nome,
        id: evento.terapeuta.usuario.id,
      };

      evento.diasFrequencia =
        evento.diasFrequencia && evento.diasFrequencia.split(',');
      evento.exdate = evento?.exdate ? evento.exdate.split(',') : [];

      switch (true) {
        case evento.frequencia.id !== 1 && evento.intervalo.id === 1: // com dias selecionados e todas semanas
          formated = {
            ...evento,
            data: {
              start: evento.start,
              end: evento.end,
            },
            title: evento.paciente.nome,
            groupId: evento.id,
            daysOfWeek: evento.diasFrequencia,
            // startTime: formatDateTime(evento.start, evento.dataInicio),
            // endTime: formatDateTime(evento.end, evento.dataInicio),
            borderColor: cor,
            backgroundColor: cor,
            exdate: evento.exdate,
            rrule: {
              freq: 'weekly',
              // byweekday: evento.diasFrequencia,
              dtstart: formatDateTime(evento.start, evento.dataInicio),
            },
          };

          if (evento.dataFim) {
            formated.rrule.until = formatDateTime(evento.start, evento.dataFim);
          }

          break;
        case evento.frequencia.id !== 1 && evento.intervalo.id !== 1: // com dias selecionados e intervalos
          formated = {
            ...evento,
            data: {
              start: evento.start,
              end: evento.end,
            },
            title: evento.paciente.nome,
            groupId: evento.id,
            borderColor: cor,
            backgroundColor: cor,
            exdate: evento.exdate,
            rrule: {
              freq: 'weekly',
              interval: evento.intervalo.id,
              byweekday: evento.diasFrequencia,
              dtstart: formatDateTime(evento.start, evento.dataInicio),
            },
          };

          if (evento.dataFim) {
            formated.rrule.until = formatDateTime(evento.start, evento.dataFim);
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
            title: evento.paciente.nome,
            date: evento.dataInicio,
            start: formatDateTime(evento.start, evento.dataInicio),
            end: formatDateTime(evento.end, evento.dataInicio),
            borderColor: cor,
            backgroundColor: cor,
          };

          delete formated.exdate;
          delete formated.diasFrequencia;
          break;
      }

      eventosFormat.push(formated);
    });
    console.log(eventosFormat);

    return eventosFormat;
  }
  async getMonth(params: any) {
    const inicioDoMes = getPrimeiroDoMes(params.ano, params.mes);
    const ultimoDiaDoMes = getUltimoDoMes(params.ano, params.mes);

    const eventos = await this.prismaService.calendario.findMany({
      select: {
        id: true,
        // groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        ciclo: true,
        observacao: true,
        exdate: true,
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
        statusEventos: {
          select: {
            nome: true,
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
      where: {
        dataInicio: {
          lte: ultimoDiaDoMes, // menor que o ultimo dia do mes
          // gte: inicioDoMes, // maior que o primeiro dia do mes
        },
        OR: [
          {
            dataFim: '',
          },
          {
            dataFim: {
              // lte: ultimoDiaDoMes, // menor que o ultimo dia do mes
              gte: inicioDoMes, // maior que o primeiro dia do mes
            },
          },
        ],
      },
    });

    const eventosFormat = await this.formatEvents(eventos);
    return eventosFormat;
  }
  async getFilterFinancialPaciente({
    dataInicio,
    dataFim,
    id,
  }: FilterFinancialTerapeutaProps) {
    const eventos = await this.prismaService.calendario.findMany({
      select: {
        id: true,
        groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        exdate: true,

        ciclo: true,
        observacao: true,
        paciente: {
          select: {
            nome: true,
            id: true,
            vagaTerapia: {
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
      where: {
        dataInicio: {
          lte: dataFim, // menor que o ultimo dia do mes
        },
        OR: [
          {
            dataFim: '',
          },
          {
            dataFim: {
              gte: dataInicio, // maior que o primeiro dia do mes
            },
          },
        ],
        pacienteId: id,
        statusEventos: {
          cobrar: true,
        },
      },
      orderBy: {
        terapeuta: {
          usuario: {
            nome: 'asc',
          },
        },
      },
    });

    return eventos;
  }
  async getFilterFinancialTerapeuta({
    dataInicio,
    dataFim,
    id,
  }: FilterFinancialTerapeutaProps) {
    const eventos = await this.prismaService.calendario.findMany({
      select: {
        id: true,
        groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        exdate: true,

        ciclo: true,
        observacao: true,
        paciente: {
          select: {
            nome: true,
            id: true,
            vagaTerapia: {
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
      where: {
        dataInicio: {
          lte: dataFim, // menor que o ultimo dia do mes
        },
        OR: [
          {
            dataFim: '',
          },
          {
            dataFim: {
              gte: dataInicio, // maior que o primeiro dia do mes
            },
          },
        ],
        terapeutaId: id,
        statusEventos: {
          cobrar: true,
        },
      },
      orderBy: {
        paciente: {
          nome: 'asc',
        },
      },
    });

    return eventos;
  }
}
