import { Inject, Injectable, forwardRef } from '@nestjs/common';
import * as moment from 'moment';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaClient } from 'src/util/crud';
import {
  HOURS,
  dateFormatYYYYMMDD,
  getDates,
  getDatesBetween,
  horaEstaEntre,
  weekDay,
} from 'src/util/format-date';
import { DEVICE } from 'src/util/util';
import { buildDateRangeWhere, buildQueryFilter } from 'src/util/filters';

@Injectable()
export class TerapeutaService {
  eventFree: any = {
    id: 0,
    dataInicio: '2023-02-24',
    dataFim: '2023-02-27',
    start: '20:55',
    end: '21:55',
    observacao: '',
    paciente: {
      nome: 'Livre',
      id: 1,
    },
    modalidade: {
      nome: 'Livre',
      id: 1,
    },
    especialidade: {
      id: 2,
      nome: '-',
    },
    terapeuta: {
      nome: '-',
      id: 5,
    },
    funcao: {
      nome: 'Funcao 2',
      id: 2,
    },
    localidade: {
      nome: '-',
      id: 2,
    },
    statusEventos: {
      nome: '-',
      id: 1,
    },
    frequencia: {
      nome: 'Único',
      id: 1,
    },
    data: {
      start: '20:55',
      end: '21:55',
    },
    title: 'Livre',
    groupId: 3,
    daysOfWeek: [],
    startTime: '20:55',
    endTime: '21:55',
    borderColor: 'green',
    backgroundColor: 'green',
    icon: 'pi pi-calendar',
    color: 'green',
    disabled: true,
    isDevolutiva: false,
    rrule: {
      freq: 'weekly',
      dtstart: '2023-02-24 20:55',
      until: '2023-02-27 20:55',
    },
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  private getEventRecurrenceData(ev: any, endDate: string) {
    const frequenciaId = Number(ev?.frequencia?.id ?? 1);
    const intervaloId = Number(ev?.intervalo?.id ?? 1);
    const diasFrequencia = Array.isArray(ev?.diasFrequencia)
      ? ev.diasFrequencia
      : typeof ev?.diasFrequencia === 'string'
      ? ev.diasFrequencia.split(',')
      : [];
    const exdate = Array.isArray(ev?.exdate) ? ev.exdate : [];

    if (frequenciaId === 1) {
      return {
        frequenciaId,
        intervaloId,
        diasFrequencia,
        exdate,
        isSingleEvent: true,
      };
    }

    return {
      frequenciaId,
      intervaloId,
      diasFrequencia,
      exdate,
      isSingleEvent: false,
      dataFim: ev.dataFim || endDate,
    };
  }

  private groupEventByDate(
    eventosFormatados: Record<string, any[]>,
    date: string,
    event: any,
  ) {
    if (eventosFormatados[date]) {
      eventosFormatados[date].push(event);
      return;
    }

    eventosFormatados[date] = [event];
  }

  private buildFreeSlot(day: string, hour: string, terapeuta: any) {
    const date = moment(`${day}T${hour}:00`);
    const hoursFinal = moment(`${day}T${hour}:00`).add(1, 'hours');
    const hoursFinalFormat = hoursFinal.format('HH:mm');

    return {
      ...this.eventFree,
      dataInicio: day,
      dataFim: day,
      start: hour,
      startTime: hour,
      time: `${hour} - ${hoursFinalFormat}`,
      end: hoursFinalFormat,
      endTime: hoursFinalFormat,
      date: day,
      terapeuta: {
        nome: terapeuta?.usuario?.nome || '',
        id: terapeuta?.usuario?.id || '',
      },
      rrule: {
        dtstart: date.format('YYYY-MM-DD HH:mm'),
        until: hoursFinal.format('YYYY-MM-DD HH:mm'),
        freq: 'weekly',
      },
    };
  }

  private buildSessionSlot(day: string, hour: string, sessao: any) {
    const sessaoDataHoraFim = moment(`${day}T${sessao.data.end}:00`);
    const isInPast = sessaoDataHoraFim.isBefore(new Date());

    sessao.isDevolutiva = sessao.modalidade.nome === 'Devolutiva';
    sessao.time = `${sessao.data.start} - ${sessao.data.end}`;
    sessao.disabled =
      isInPast ||
      sessao.statusEventos.nome.includes('permanente') ||
      sessao.statusEventos.nome == 'Atendido';

    sessao.icon = 'pi pi-calendar';
    sessao.color = '#FACC15';

    return sessao;
  }

  private isSlotOccupiedByEvent(slotHour: string, sessao: any) {
    if (!sessao?.data?.start || !sessao?.data?.end) {
      return false;
    }

    const slotStart = moment(slotHour, 'HH:mm');
    const slotEnd = moment(slotHour, 'HH:mm').add(1, 'hour');
    const eventStart = moment(sessao.data.start, 'HH:mm');
    const eventEnd = moment(sessao.data.end, 'HH:mm');

    return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
  }

  private getCargaHorariaDayKey(date: Date | string) {
    const parsedDate =
      typeof date === 'string'
        ? moment(`${date}T12:00:00`, 'YYYY-MM-DDTHH:mm:ss')
        : moment(date);
    const dayOfWeek = parsedDate.day();

    const dayLabels = [
      'Segunda-feira',
      'Terca-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];

    if (dayOfWeek === 0) {
      return undefined;
    }

    return dayLabels[dayOfWeek - 1];
  }

  private addItemToArrays(
    mobileArray: Record<string, any[]>,
    webArray: any[],
    day: string,
    item: any,
  ) {
    const isDuplicate = webArray.some((existing: any) => {
      const sameDay =
        existing.date === day ||
        existing.dataInicio === day ||
        existing.data?.start === item.data?.start;
      const sameStart =
        existing.start === item.start &&
        existing.data?.start === item.data?.start;
      const sameIdentity =
        existing.id === item.id &&
        existing.paciente?.nome === item.paciente?.nome;

      return sameDay && sameStart && sameIdentity;
    });

    if (isDuplicate) {
      return;
    }

    if (mobileArray[day]) {
      mobileArray[day].push(item);
    } else {
      mobileArray[day] = [item];
    }

    webArray.push(item);
  }

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

    const user = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        ativo: true,
        AND: {
          perfil: {
            nome: 'Terapeuta',
          },
        },
      },
    });

    return user;
  }

  async getAll() {
    const prisma = this.prismaService.getPrismaClient();

    const user = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
        terapeuta: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        ativo: true,
        AND: {
          perfil: {
            nome: 'Terapeuta',
          },
        },
      },
    });

    return user;
  }

  async getAvailableTimes(
    startDate: string,
    endDate: string,
    query: any,
    device: string,
    login: string,
  ) {
    const prisma = this.prismaService.getPrismaClient();

    const filter = buildQueryFilter(query);

    const terapeutaId = parseInt(query.terapeutaId);
    const [terapeuta, events, datas] = await Promise.all([
      prisma.terapeuta.findUnique({
        select: {
          especialidade: true,
          cargaHoraria: true,
          usuario: {
            select: {
              nome: true,
              id: true,
            },
          },
        },
        where: {
          usuarioId: terapeutaId,
        },
      }),
      prisma.calendario.findMany({
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
          ...filter,
          terapeutaId: terapeutaId,
          ...buildDateRangeWhere(startDate, endDate),
        },
        orderBy: {
          dataInicio: 'asc',
        },
      }),
      getDatesBetween(startDate, endDate),
    ]);

    if (!Boolean(terapeuta)) {
      // throw new Error('Terapeuta não encontrado');
      return [];
    }

    const eventosFormat = await this.agendaService.formatEvents(events, login);

    const eventosFormatados: any = {};

    await Promise.all(
      eventosFormat.map(async (ev: any) => {
        const recurrenceData = this.getEventRecurrenceData(ev, endDate);

        if (recurrenceData.isSingleEvent) {
          this.groupEventByDate(eventosFormatados, ev.dataInicio, ev);
          return;
        }

        const datasRecorrentes = await getDates(
          recurrenceData.diasFrequencia,
          ev.dataInicio,
          recurrenceData.dataFim,
          recurrenceData.intervaloId,
          recurrenceData.exdate,
        );

        await Promise.all(
          datasRecorrentes.map((dataRecorrentes: string) => {
            ev.date = dateFormatYYYYMMDD(dataRecorrentes);
            this.groupEventByDate(eventosFormatados, dataRecorrentes, ev);
          }),
        );
      }),
    );

    const cargaHoraria: any =
      terapeuta?.cargaHoraria && typeof terapeuta.cargaHoraria === 'string'
        ? JSON.parse(terapeuta.cargaHoraria)
        : {};

    const mobileArray: any = {};
    const webArray: any = [];

    await Promise.all(
      datas.map(async (day: any) => {
        const dateEvent = new Date(`${day}T12:00:00`);
        const dayOfWeek = this.getCargaHorariaDayKey(day);
        const horariosTerapeuta = dayOfWeek
          ? cargaHoraria[dayOfWeek]
          : undefined;

        await Promise.all(
          HOURS?.map(async (h) => {
            const eventoAdd = this.buildFreeSlot(day, h, terapeuta);

            const eventosDoDia = eventosFormatados[day] || [];

            const sessoes = Array.isArray(eventosDoDia)
              ? eventosDoDia.filter((e: any) => {
                  const exdate = Array.isArray(e?.exdate) ? e.exdate : [];
                  return (
                    horaEstaEntre(h, e.data.start) &&
                    !exdate.includes(`${day} ${h}`)
                  );
                })
              : [];

            const hasOccupiedSlot = sessoes.some((sessao: any) =>
              this.isSlotOccupiedByEvent(h, sessao),
            );

            const shouldCreateFreeSlot =
              !hasOccupiedSlot &&
              horariosTerapeuta?.[h] &&
              dateEvent.getTime() > new Date().getTime();

            if (eventosDoDia.length) {
              if (sessoes.length) {
                await Promise.all(
                  sessoes.map((sessao: any) => {
                    const verificaSeJaFoiIncluido = webArray.filter(
                      (e: any) => {
                        if (
                          e.id === sessao.id &&
                          e.paciente.nome === sessao.paciente.nome &&
                          e.data.start === sessao.data.start
                        ) {
                          return e;
                        }
                      },
                    );

                    if (!verificaSeJaFoiIncluido.length) {
                      const sessaoFormatada = this.buildSessionSlot(
                        day,
                        h,
                        sessao,
                      );

                      this.addItemToArrays(
                        mobileArray,
                        webArray,
                        day,
                        sessaoFormatada,
                      );
                    }
                  }),
                );
              } else if (shouldCreateFreeSlot) {
                this.addItemToArrays(mobileArray, webArray, day, eventoAdd);
              }
            } else if (shouldCreateFreeSlot) {
              this.addItemToArrays(mobileArray, webArray, day, eventoAdd);
            }
          }),
        );
      }),
    );

    const mobileSort = {};

    if (device === DEVICE.mobile) {
      const arr = {};

      Object.keys(mobileArray).map((key: string) => {
        arr[key] = mobileArray[key].filter((item) => {
          return (
            !item['exdate'] || !item.exdate.includes(`${key} ${item.start}`)
          );
        });
      });

      Object.keys(arr).map((key: string) => {
        mobileSort[key] = arr[key].sort((a, b) =>
          a.data.start.localeCompare(b.data.start),
        );
      });
    }

    return device === DEVICE.mobile ? mobileSort : webArray;
  }

  async getTerapeutaByEspecialidade() {
    const prisma = this.prismaService.getPrismaClient();

    const user = await prisma.terapeuta.findMany({
      select: {
        usuarioId: true,
        usuario: true,
        especialidade: true,
      },
    });

    const list = await Promise.all(
      user.map((terapeuta: any) => {
        return {
          id: terapeuta.usuario.id,
          nome: terapeuta.usuario.nome,
          especialidadeId: terapeuta.especialidade.id,
        };
      }),
    );

    return list;
  }
  async getTerapeutaByEspecialidadeDropdown(especialidade: string) {
    const prisma = this.prismaService.getPrismaClient();

    const terapeuta = await prisma.terapeuta.findMany({
      select: {
        usuarioId: true,
        usuario: true,
      },
      where: {
        especialidade: {
          nome: especialidade,
        },
        usuario: {
          ativo: true,
        },
      },
      orderBy: {
        usuario: {
          nome: 'asc',
        },
      },
    });

    const list = await Promise.all(
      terapeuta.map((terapeuta: any) => {
        return {
          id: terapeuta.usuario.id,
          nome: terapeuta.usuario.nome,
        };
      }),
    );

    return list;
  }
  async getPacienteByTerapeutaDropdown(terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const agenda = await prisma.calendario.findMany({
      select: {
        paciente: true,
      },
      where: {
        terapeutaId: terapeutaId,
      },
      orderBy: {
        paciente: {
          nome: 'asc',
        },
      },
    });

    return await Promise.all(
      agenda.map((evento: any) => {
        return {
          id: evento.paciente.id,
          nome: evento.paciente.nome,
        };
      }),
    );
  }
}
