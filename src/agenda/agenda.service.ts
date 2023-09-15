import { Injectable } from '@nestjs/common';
import { LocalidadeService } from 'src/localidade/localidade.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import {
  dateSubtractDay,
  formatDateTime,
  getPrimeiroDoMes,
} from 'src/util/format-date';
import { CalendarioCreateParam, ObjProps } from './agenda.interface';
import { FrequenciaService } from 'src/frequencia/frequencia.service';
import { FREQUENCIA } from 'src/frequencia/frequencia.interface';
import * as bcrypt from 'bcryptjs';
import moment from 'moment';
import { VagaService } from 'src/vaga/vaga.service';

@Injectable()
export class AgendaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly localidadadeService: LocalidadeService,
    private readonly frequenciaService: FrequenciaService,
    private readonly vagaService: VagaService,
  ) {}

  formatEvent(event: any) {
    return {
      groupId: event?.groupId,
      km: event?.km,
      dataInicio: event?.dataInicio,
      dataFim: event?.dataFim,
      start: event?.start,
      end: event?.end,
      ciclo: event?.ciclo,
      observacao: event?.observacao,
      pacienteId: event?.paciente?.id,
      modalidadeId: event?.modalidade?.id,
      especialidadeId: event?.especialidade?.id,
      terapeutaId: event?.terapeuta?.id,
      funcaoId: event?.funcao?.id,
      localidadeId: event.localidade?.id,
      statusEventosId: event?.statusEventos?.id,
      diasFrequencia: event?.diasFrequencia?.join(),
      isExterno: event?.isExterno,
      frequenciaId: event?.frequencia?.id,
      intervaloId: event?.intervalo?.id,
    };
  }

  async formatEvents(eventos: any, login: string) {
    const usuario = await this.userService.getUser(login);

    const eventosFormat = await Promise.all(
      eventos.map((evento: any) => {
        let formated: any = {};
        const cor =
          evento.statusEventos.nome.includes('Cancelado') ||
          evento.statusEventos.nome.includes('cancelado')
            ? '#f87171'
            : evento.especialidade.cor;
        delete evento.especialidade.cor;

        evento.localidade = {
          nome: this.localidadadeService.formatLocalidade(evento.localidade),
          id: evento.localidade.id,
        };

        evento.terapeuta = {
          nome: evento.terapeuta.usuario.nome,
          id: evento.terapeuta.usuario.id,
        };

        evento.diasFrequencia =
          evento.diasFrequencia && evento.diasFrequencia.split(',');

        evento.exdate = evento.exdate ? evento.exdate.split(',') : [];
        evento.exdate = evento.exdate.map(
          (ex: string) => `${ex} ${evento.start}`,
        );

        evento.canDelete = evento.usuarioId === usuario.id;

        const diasFrequencia: number[] =
          evento.diasFrequencia &&
          evento.diasFrequencia.map((dia: string) => Number(dia) - 1);

        switch (true) {
          case evento.frequencia.id !== 1 && evento.intervalo.id === 1: // com dias selecionados e todas semanas
            formated = {
              ...evento,
              data: {
                start: evento.start,
                end: evento.end,
              },
              title: evento.paciente.nome,
              groupId: evento.groupId,
              daysOfWeek: diasFrequencia,
              isChildren: evento.isChildren,
              startTime: evento.start,
              endTime: evento.end,
              borderColor: cor,
              backgroundColor: cor,
              rrule: {
                freq: 'weekly',
                // byweekday: diasFrequencia,
                dtstart: formatDateTime(evento.start, evento.dataInicio),
              },
            };

            if (evento.dataFim) {
              formated.rrule.until = formatDateTime(
                evento.start,
                evento.dataFim,
              );
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
              groupId: evento.groupId,
              borderColor: cor,
              backgroundColor: cor,
              isChildren: evento.isChildren,
              rrule: {
                freq: 'weekly',
                interval: evento.intervalo.id,
                byweekday: diasFrequencia,
                dtstart: `${evento.dataInicio}T${evento.start}:00Z`,
              },
            };

            if (evento.dataFim) {
              formated.rrule.until = `${evento.dataFim}T${evento.end}:00Z`; //formatDateTime(evento.end, evento.dataFim);
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
    const inicioDoMes = params.start;
    const ultimoDiaDoMes = params.end;

    const filter: any = {};
    Object.keys(query).map((key: string) => (filter[key] = Number(query[key])));

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
        isExterno: true,
        isChildren: true,
        usuarioId: true,
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
      },
    });

    const eventosFormat = await this.formatEvents(eventos, login);
    return eventosFormat;
  }

  async getRange(params: any, device: string, login: string) {
    let inicioDoMes = params.start;
    let ultimoDiaDoMes = params.end;

    if (device === 'mobile') {
      const now = new Date();
      const mouth = now.getMonth();
      inicioDoMes = getPrimeiroDoMes(now.getFullYear(), mouth - 1);
      ultimoDiaDoMes = getPrimeiroDoMes(now.getFullYear(), mouth + 2);
    }

    const eventos = await this.prismaService.calendario.findMany({
      select: {
        id: true,
        groupId: true,
        dataInicio: true,
        dataFim: true,
        start: true,
        end: true,
        diasFrequencia: true,
        ciclo: true,
        observacao: true,
        isChildren: true,
        usuarioId: true,
        isExterno: true,
        km: true,
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
        AND: [
          {
            OR: [
              {
                dataFim: '',
              },
              {
                dataFim: {
                  gte: inicioDoMes,
                },
              },
            ],
          },
          {
            dataInicio: {
              lte: ultimoDiaDoMes,
            },
          },
        ],
      },
    });

    const eventosFormat = await this.formatEvents(eventos, login);
    return eventosFormat;
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

    const diasFrequencia = body.diasFrequencia.join(',');

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

        return {
          groupId: hash,
          km: data?.km,
          dataInicio: data.dataInicio,
          dataFim: data.dataFim,
          start: data.start,
          end: data.end,
          diasFrequencia: diasFrequencia,
          ciclo: 'ativo',
          observacao: data.observacao || '',
          pacienteId: data.paciente.id,
          modalidadeId: data.modalidade.id,
          especialidadeId: data.especialidade.id,
          terapeutaId: data.terapeuta.id,
          funcaoId: data.funcao.id,
          localidadeId: data.localidade.id,
          statusEventosId: data.statusEventos.id,
          frequenciaId: frequencia.id,
          intervaloId: data.intervalo.id,
          isExterno: !!data.isExterno,

          usuarioId: user.id,
        };
      }),
    );

    return await this.prismaService.calendario.createMany({
      data: datas,
    });
  }

  async createEventoDefault(
    body: CalendarioCreateParam,
    login: string,
    diasFrequencia: any,
    frequencia: any,
    user: any,
  ) {
    const hash: string = await this.getHashGroupId(
      body.paciente.id,
      body.modalidade.id,
      body.especialidade.id,
      body.funcao.id,
    );

    const eventData = {
      groupId: hash,
      dataInicio: body.dataInicio,
      km: body?.km,
      dataFim: body.dataFim || '',
      start: body.start,
      end: body.end,
      diasFrequencia: diasFrequencia,
      ciclo: 'ativo',
      observacao: body.observacao || '',
      pacienteId: body.paciente.id,
      modalidadeId: body.modalidade.id,
      especialidadeId: body.especialidade.id,
      terapeutaId: body.terapeuta.id,
      funcaoId: body.funcao.id,
      localidadeId: body.localidade.id,
      statusEventosId: body.statusEventos.id,
      frequenciaId: frequencia.id,
      intervaloId: body.intervalo.id,
      isExterno: !!body.isExterno,
      usuarioId: user.id,
    };

    const evento = await this.prismaService.$transaction([
      this.prismaService.calendario.create({
        data: eventData,
      }),
    ]);

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
    let dataFim = dateSubtractDay(body.dataAtual, 2);
    const isCanceled = body.statusEventos.nome.includes('permanente');
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

  async updateCalendario(body: any, login: string) {
    const eventoSalvo: any[] = await this.prismaService.calendario.findMany({
      where: { groupId: body.groupId },
    });

    switch (true) {
      case eventoSalvo.length === 0:
        throw new Error('Não existe evento desse groupo!');
      case eventoSalvo.length === 1:
        return this.updateEventoUnicoGrupo(body, login);
      case eventoSalvo.length >= 2:
        const data = this.formatEvent(body);

        if (body.changeAll) {
          delete data.dataFim;

          return await this.prismaService.calendario.updateMany({
            data: {
              ...data,
            },
            where: {
              groupId: data.groupId,
            },
          });
        } else {
          if (body.isChildren) {
            try {
              const eventos = this.prismaService.calendario.update({
                data,
                where: {
                  id: body.id,
                },
              });

              return eventos;
            } catch (error) {
              console.log(error);
            }
          } else {
            const evento = eventoSalvo.filter(
              (event: any) => event.id === body.id,
            )[0];
            body.exdate = evento.exdate;

            this.updateEventoRecorrentes(body, login);
          }
        }
      default:
        break;
    }
  }

  async updateEventoUnicoGrupo(event: any, login: string) {
    let evento;
    switch (event.frequencia.id) {
      case 1: //se o evento for único
        const data = this.formatEvent(event);
        evento = await this.prismaService.calendario.update({
          data,
          where: {
            id: event.id,
          },
        });
        break;
      case 2: // se o evento for recorrente
        evento = await this.updateEventoRecorrentes(event, login);

      default:
        break;
    }

    return evento;
  }

  async updateCalendarioMobile(body: any, login: string) {
    const statusEventos = await this.prismaService.statusEventos.findFirst({
      where: {
        nome: 'Atendido',
      },
    });

    body.statusEventos = statusEventos;

    this.updateCalendario(body, login);
  }
  async updateCalendarioAtestado(body: any, login: string) {
    const statusEventos = await this.prismaService.statusEventos.findFirst({
      where: {
        nome: 'Atestado',
      },
    });

    body.statusEventos = statusEventos;

    this.updateCalendario(body, login);
  }

  getExDate(event: any) {
    let _exdate =
      typeof event?.exdate === 'string' ? event?.exdate.split() : event?.exdate;
    const exdate: string[] = _exdate || [];
    exdate.push(event.dataAtual);
    return exdate;
  }

  async updateEventoRecorrentes(event: any, login: string) {
    const data = this.formatEvent(event);

    let dataFim = dateSubtractDay(event.dataAtual, 1);

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
      case !event.changeAll: // se for mudar todos
        const usuario = await this.userService.getUser(login);

        try {
          const [, eventos] = await Promise.all([
            this.prismaService.calendario.update({
              data: {
                exdate: exdate.join(),
              },
              where: {
                id: event.id,
              },
            }),
            this.prismaService.calendario.create({
              data: {
                ...data,
                dataInicio: event.dataAtual,
                dataFim,
                usuarioId: usuario.id,
                isChildren: true,
              },
            }),
          ]);

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
    const evento: any = await this.prismaService.calendario.findFirst({
      where: { id: event.id },
    });

    const dataInicio = moment(evento.dataInicio);
    const dataAtual = moment(event.dataAtual);

    const data = this.formatEvent(event);

    if (exdate !== '') {
      event.exdate = exdate;
    }

    if (dataInicio.isBefore(dataAtual)) {
      const usuario = await this.userService.getUser(login);
      let dataFim = moment(event.dataAtual).add(1, 'days').format('YYYY-MM-DD');

      // se data de inicio já passou, for recorrente e mudar todos
      const [, eventos] = await Promise.all([
        this.prismaService.calendario.create({
          data: {
            ...data,
            dataInicio: event.dataAtual,
            usuarioId: usuario.id,
            isChildren: true,
            dataFim,
          },
        }),
        this.prismaService.calendario.updateMany({
          data: {
            // dataFim: dataAtual.subtract(1, 'day').format('YYYY-MM-DD'),
            dataFim: dataAtual.subtract(1, 'day').format('YYYY-MM-DD'),
            statusEventosId: evento.statusEventosId,
          },
          where: {
            id: event.id,
          },
        }),
      ]);

      return eventos;
    } else {
      delete event.dataAtual;
      const eventosAll = await this.prismaService.calendario.updateMany({
        data: {
          ...data,
          statusEventosId: evento.statusEventosId,
        },
        where: {
          groupId: data.groupId,
        },
      });
      return eventosAll;
    }
  };

  async delete(eventId: number, login: string) {
    try {
      const { id } = await this.userService.getUser(login);
      const evento = await this.prismaService.calendario.findFirstOrThrow({
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
        },
        where: { id: Number(eventId) },
      });

      this.vagaService.update({
        desagendar: [evento.especialidadeId],
        agendar: [],
        vagaId: evento.paciente?.vaga?.id || 0,
        pacienteId: evento.paciente.id,
        statusPacienteCod: evento.paciente.statusPacienteCod,
      });

      return await this.prismaService.calendario.deleteMany({
        where: {
          groupId: evento.groupId,
          usuarioId: id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getFilterFinancialPaciente({
    dataInicio,
    dataFim,
    pacienteId,
    statusEventosId,
  }: any) {
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
        km: true,

        ciclo: true,
        observacao: true,
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
        pacienteId: pacienteId,
        statusEventosId: statusEventosId,
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

  getFilterFinancialTerapeuta = async ({
    dataInicio,
    dataFim,
    terapeutaId,
  }: any) => {
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
        km: true,

        ciclo: true,
        observacao: true,
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
      where: {
        terapeutaId: terapeutaId,
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
      },
      orderBy: {
        paciente: {
          nome: 'asc',
        },
      },
    });

    return eventos;
  };
}
