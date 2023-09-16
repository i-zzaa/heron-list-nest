import { Inject, Injectable, forwardRef } from '@nestjs/common';
import moment from 'moment';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma.service';
import {
  HOURS,
  dateFormatYYYYMMDD,
  getDates,
  getDatesBetween,
  horaEstaEntre,
  weekDay,
} from 'src/util/format-date';
import { DEVICE } from 'src/util/util';

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
      nome: 'Fono',
    },
    terapeuta: {
      nome: 'TERAPEUTA FONO',
      id: 5,
    },
    funcao: {
      nome: 'Funcao 2',
      id: 2,
    },
    localidade: {
      nome: 'Casa 1 - Sala 2',
      id: 2,
    },
    statusEventos: {
      nome: 'Confirmar',
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
    rrule: {
      freq: 'weekly',
      dtstart: '2023-02-24 20:55',
      until: '2023-02-27 20:55',
    },
  };

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => AgendaService))
    private readonly agendaService: AgendaService,
  ) {}

  async getAll() {
    const user = await this.prismaService.usuario.findMany({
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
    const filter: any = {};
    Object.keys(query).map((key: string) => (filter[key] = Number(query[key])));

    const terapeutaId = parseInt(query.terapeutaId);
    const [terapeuta, events, datas] = await Promise.all([
      this.prismaService.terapeuta.findUnique({
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
      this.prismaService.calendario.findMany({
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
          dataInicio: {
            lte: endDate, // menor que o ultimo dia do mes
            // gte: inicioDoMes, // maior que o primeiro dia do mes
          },
          OR: [
            {
              dataFim: '',
            },
            {
              dataFim: {
                // lte: ultimoDiaDoMes, // menor que o ultimo dia do mes
                gte: startDate, // maior que o primeiro dia do mes
              },
            },
          ],
        },
      }),
      getDatesBetween(startDate, endDate),
    ]);

    if (!Boolean(terapeuta)) {
      throw new Error('Terapeuta não encontrado');
    }

    const eventosFormat = await this.agendaService.formatEvents(events, login);

    const eventosFormatados: any = {};

    await eventosFormat.flatMap(async (ev: any) => {
      if (ev.frequencia.id === 1) {
        if (Boolean(eventosFormatados[ev.dataInicio])) {
          eventosFormatados[ev.dataInicio].push(ev);
        } else {
          eventosFormatados[ev.dataInicio] = [ev];
        }
        return;
      }

      const dataFim = ev.dataFim || endDate;
      const datasRecorrentes = await getDates(
        ev.diasFrequencia,
        ev.dataInicio,
        dataFim,
        ev.intervalo.id,
        ev.exdate,
      );

      await Promise.all(
        datasRecorrentes.map((dataRecorrentes: string) => {
          ev.date = dateFormatYYYYMMDD(dataRecorrentes);

          if (Boolean(eventosFormatados[dataRecorrentes])) {
            eventosFormatados[dataRecorrentes].push(ev);
          } else {
            eventosFormatados[dataRecorrentes] = [ev];
          }
        }),
      );
    });

    let cargaHoraria: any =
      terapeuta?.cargaHoraria && typeof terapeuta.cargaHoraria === 'string'
        ? JSON.parse(terapeuta.cargaHoraria)
        : {};

    const mobileArray: any = {};
    const webArray: any = [];

    await Promise.all(
      datas.map(async (day: any) => {
        const dateEvent = new Date(day);
        const dayOfWeek = weekDay[dateEvent.getDay()];
        const horariosTerapeuta = cargaHoraria[dayOfWeek];

        await Promise.all(
          HOURS.map(async (h) => {
            const strDate = `${day}T${h}:00`;
            const date = moment(strDate);

            const hoursFinal = moment(strDate).add(1, 'hours');
            const hoursFinalFormat = hoursFinal.format('HH:mm');

            const eventoAdd = {
              ...this.eventFree,
              dataInicio: day,
              dataFim: day,
              start: h,
              startTime: h,
              time: `${h} - ${hoursFinalFormat}`,
              end: hoursFinalFormat,
              endTime: hoursFinalFormat,
              date: day,
              terapeuta: {
                nome: terapeuta?.usuario?.nome || '',
                id: terapeuta?.usuario?.id || '',
              },
              localidade: { nome: 'Sem Localizacao', id: 0 },
              statusEventos: { nome: 'Não criado', id: 0 },
              disabled: true,
              isDevolutiva: false,
              rrule: {
                dtstart: date.format('YYYY-MM-DD HH:mm'),
                until: hoursFinal.format('YYYY-MM-DD HH:mm'),
                freq: 'weekly',
              },
            };

            const eventosDoDia = eventosFormatados[day] || [];

            if (
              date.isAfter(new Date()) &&
              horariosTerapeuta[h] &&
              !eventosDoDia.length
            ) {
              if (Boolean(mobileArray[day])) {
                mobileArray[day].push(eventoAdd);
              } else {
                mobileArray[day] = [eventoAdd];
              }

              webArray.push(eventoAdd);
            }

            if (eventosDoDia.length) {
              const sessoes = await Promise.all(
                eventosDoDia.filter(
                  (e: any) =>
                    horaEstaEntre(h, e.data.start) &&
                    !e.exdate.includes(`${day} ${h}`),
                ),
              );

              if (sessoes.length) {
                await Promise.all(
                  sessoes.map((sessao: any) => {
                    const verificaSeJaFoiIncluido = webArray.filter(
                      (e: any) => {
                        if (
                          e.id === sessao.id &&
                          e.paciente.nome === sessao.paciente.nome &&
                          day === sessao.date &&
                          e.data.start === sessao.data.start
                        ) {
                          return e;
                        }
                      },
                    );

                    if (!verificaSeJaFoiIncluido.length) {
                      const sessaoDataHoraFim = moment(
                        `${day}T${sessao.data.end}:00`,
                      );
                      const isInPast = sessaoDataHoraFim.isBefore(new Date());

                      sessao.isDevolutiva =
                        sessao.modalidade.nome === 'Devolutiva';
                      sessao.time = `${sessao.data.start} - ${sessao.data.end}`;
                      sessao.disabled =
                        isInPast ||
                        sessao.statusEventos.nome.includes('permanente') ||
                        sessao.statusEventos.nome == 'Atendido';

                      if (Boolean(mobileArray[day])) {
                        mobileArray[day].push(sessao);
                      } else {
                        mobileArray[day] = [sessao];
                      }

                      webArray.push(sessao);
                    }
                  }),
                );
              } else if (horariosTerapeuta[h] && date.isAfter(new Date())) {
                if (Boolean(mobileArray[day])) {
                  mobileArray[day].push(eventoAdd);
                } else {
                  mobileArray[day] = [eventoAdd];
                }

                webArray.push(eventoAdd);
              }
            }
          }),
        );
      }),
    );

    return device === DEVICE.mobile ? mobileArray : webArray;
  }

  async getTerapeutaEspecialidade() {
    const user = await this.prismaService.terapeuta.findMany({
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
}
