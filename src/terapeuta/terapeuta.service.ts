import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  HOURS,
  dateFormatYYYYMMDD,
  getDates,
  getDatesBetween,
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

  private buildEventKey(day: string, event: any) {
    const start = this.normalizeHour(event?.data?.start || event?.start);
    const end = this.normalizeHour(event?.data?.end || event?.end);
    const pacienteId = event?.paciente?.id || 'free';
    const id = event?.groupId || event?.id || 'free';

    return `${day}:${id}:${pacienteId}:${start}:${end}`;
  }

  private normalizeHour(value: any) {
    if (!value) {
      return '';
    }

    if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    const normalized = moment(value);

    return normalized.isValid() ? normalized.format('HH:mm') : String(value);
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
      data: {
        start: hour,
        end: hoursFinalFormat,
      },
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

  private buildSessionSlot(day: string, sessao: any) {
    const sessaoDataHoraFim = moment(`${day}T${sessao.data.end}:00`);
    const isInPast = sessaoDataHoraFim.isBefore(new Date());

    return {
      ...sessao,
      date: day,
      isDevolutiva: sessao.modalidade.nome === 'Devolutiva',
      time: `${sessao.data.start} - ${sessao.data.end}`,
      disabled:
        isInPast ||
        sessao.statusEventos.nome.includes('permanente') ||
        sessao.statusEventos.nome == 'Atendido',
      icon: 'pi pi-calendar',
      color: '#FACC15',
    };
  }

  private isSlotOccupiedByEvent(slotHour: string, sessao: any) {
    const eventStartRaw = sessao?.data?.start || sessao?.start;
    const eventEndRaw = sessao?.data?.end || sessao?.end;

    if (!eventStartRaw || !eventEndRaw) {
      return false;
    }

    const normalizedSlot = this.normalizeHour(slotHour);
    const normalizedStart = this.normalizeHour(eventStartRaw);
    const normalizedEnd = this.normalizeHour(eventEndRaw);

    const slotStart = moment(normalizedSlot, 'HH:mm', true);
    const slotEnd = moment(normalizedSlot, 'HH:mm', true).add(1, 'hour');
    const eventStart = moment(normalizedStart, 'HH:mm', true);
    const eventEnd = moment(normalizedEnd, 'HH:mm', true);

    if (
      !slotStart.isValid() ||
      !slotEnd.isValid() ||
      !eventStart.isValid() ||
      !eventEnd.isValid()
    ) {
      return false;
    }

    return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
  }

  private getCargaHorariaDayKey(date: Date | string) {
    const dayOfWeek =
      typeof date === 'string'
        ? moment(date, 'YYYY-MM-DD').isoWeekday()
        : moment(date).isoWeekday();

    if (dayOfWeek === 7) {
      return undefined;
    }

    return weekDay[dayOfWeek - 1];
  }

  private isEventExcludedOnDay(event: any, day: string) {
    return Boolean(event?.exdate?.includes(`${day} ${event?.data?.start}`));
  }

  private eventMatchesSlot(slot: string, event: any) {
    return this.isSlotOccupiedByEvent(slot, event);
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

    for (const ev of eventosFormat) {
      const recurrenceData = this.getEventRecurrenceData(ev, endDate);

      if (recurrenceData.isSingleEvent) {
        this.groupEventByDate(eventosFormatados, ev.dataInicio, {
          ...ev,
          date: ev.dataInicio,
        });
        continue;
      }

      const datasRecorrentes = await getDates(
        recurrenceData.diasFrequencia,
        ev.dataInicio,
        recurrenceData.dataFim,
        recurrenceData.intervaloId,
        recurrenceData.exdate,
      );

      datasRecorrentes
        .filter(
          (dataRecorrente: string) =>
            dataRecorrente >= startDate && dataRecorrente <= endDate,
        )
        .forEach((dataRecorrente: string) => {
          this.groupEventByDate(eventosFormatados, dataRecorrente, {
            ...ev,
            date: dateFormatYYYYMMDD(dataRecorrente),
          });
        });
    }

    const cargaHoraria: any =
      terapeuta?.cargaHoraria && typeof terapeuta.cargaHoraria === 'string'
        ? JSON.parse(terapeuta.cargaHoraria)
        : {};

    const mobileArray: any = {};
    const webArray: any = [];
    const diasRetorno = Array.from(
      new Set([...datas, ...Object.keys(eventosFormatados)]),
    ).sort((a, b) => a.localeCompare(b));
    const includedEvents = new Set<string>();
    const addItemToArrays = (day: string, item: any) => {
      const key = this.buildEventKey(day, item);

      if (includedEvents.has(key)) {
        return;
      }

      includedEvents.add(key);

      if (mobileArray[day]) {
        mobileArray[day].push(item);
      } else {
        mobileArray[day] = [item];
      }

      webArray.push(item);
    };

    for (const day of diasRetorno) {
      const dayOfWeek = this.getCargaHorariaDayKey(day);
      const horariosTerapeuta = dayOfWeek ? cargaHoraria[dayOfWeek] : undefined;
      const horariosDoDia = horariosTerapeuta
        ? Array.from(
            new Set([...HOURS, ...Object.keys(horariosTerapeuta)]),
          ).sort((a, b) => a.localeCompare(b))
        : [];
      const eventosDoDia = (eventosFormatados[day] || []).filter(
        (event: any) => !this.isEventExcludedOnDay(event, day),
      );

      for (const hour of horariosDoDia) {
        if (!horariosTerapeuta?.[hour]) {
          continue;
        }

        const slotDate = moment(`${day}T${hour}:00`);
        const sessoes = eventosDoDia
          .filter((event: any) => this.eventMatchesSlot(hour, event))
          .map((event: any) => this.buildSessionSlot(day, event));

        if (sessoes.length) {
          sessoes.forEach((sessao: any) => addItemToArrays(day, sessao));
          continue;
        }

        if (slotDate.isAfter(new Date())) {
          addItemToArrays(day, this.buildFreeSlot(day, hour, terapeuta));
        }
      }

      eventosDoDia
        .map((event: any) => this.buildSessionSlot(day, event))
        .forEach((event: any) => addItemToArrays(day, event));
    }

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

    webArray.sort((a, b) => {
      const first = `${a.date || a.dataInicio} ${a.data.start}`;
      const second = `${b.date || b.dataInicio} ${b.data.start}`;
      return first.localeCompare(second);
    });

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
