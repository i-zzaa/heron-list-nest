import { Injectable } from '@nestjs/common';
import { AgendaService } from 'src/agenda/agenda.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { dateAddtDay, dateFormatDDMMYYYY } from 'src/util/format-date';
import { TYPE_DTT, calcAcertos } from 'src/util/util';

@Injectable()
export class SessaoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  async getAll(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const data = await prisma.sessao.findMany({
      select: {
        id: true,
        resumo: true,
        sessao: true,
        paciente: {
          select: {
            nome: true,
            responsavel: true,
          },
        },
        evento: {
          select: {
            especialidade: true,
            dataInicio: true,
            terapeuta: {
              select: {
                usuario: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });

    const result = await Promise.all(
      data.map(async (item: any) => {
        const sessoes = JSON.parse(item.sessao);
        item.sessoes = await Promise.all(
          sessoes.map((sessao: any) => {
            sessao.children.map((children: any) => {
              const consecutive3 =
                children.loop[0] && children.loop[1] && children.loop[2];
              const trueCount = children.loop.filter(
                (child: any) => !!child,
              ).length;

              children.porcentagem = consecutive3
                ? 100
                : (trueCount / children.loop.length) * 100;

              return children;
            });

            return sessao;
          }),
        );

        return item;
      }),
    );

    return result;
  }

  async get(calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();
    const data: any = await prisma.sessao.findFirst({
      select: {
        id: true,
        resumo: true,
        sessao: true,
        maintenance: true,
        portage: true,
        vbmapp: true,
        selectedMaintenanceKeys: true,
      },
      where: {
        calendarioId: Number(calendarioId),
      },
    });

    if (Boolean(data?.sessao)) {
      data.sessao = data.sessao;
      data.selectedMaintenanceKeys = data.selectedMaintenanceKeys;
      data.maintenance = data.maintenance;

      data.vbmapp = data.vbmapp || {};
      data.portage = data.portage || {};
    }

    return data;
  }

  async create(body: any, login: string) {
    const prisma = this.prismaService.getPrismaClient();
    const dateFim = dateAddtDay(body.date, 1);

    const evento = await this.agendaService.updateCalendarioMobile(
      body.calendarioId,
      login,
      body.date,
      dateFim,
    );

    delete body.date;

    await prisma.sessao.create({
      data: {
        ...body,
        sessao: body.sessao || [],
        calendarioId: evento.id,
      },
    });

    await this.updateMaintenance(body.pacienteId, body.calendarioId);

    return;
  }

  isTaskCompleted(childrenArray) {
    const fourCWithNulls =
      childrenArray.slice(0, 4).every((child) => child === 'C') &&
      childrenArray.slice(4).every((child) => child === null);

    const allCs = childrenArray.every((child) => child === 'C');

    return fourCWithNulls || allCs;
  }

  processActivities(node) {
    const taskCompletionCount = {};
    const manutencao = [];

    node.forEach((group) => {
      group.forEach((item) => {
        item.children.forEach((meta) => {
          meta.children.forEach((task) => {
            const taskKey = `${task.key}`;

            if (this.isTaskCompleted(task.children)) {
              // Contabiliza quantas vezes a tarefa foi completada 100%
              if (taskCompletionCount[taskKey]) {
                taskCompletionCount[taskKey]++;
              } else {
                taskCompletionCount[taskKey] = 1;
              }

              // Se completou 100% 3 vezes, move toda a árvore para manutenção
              if (taskCompletionCount[taskKey] === 3) {
                // Adicionar ao array de manutenção a estrutura completa
                const existingIndex = manutencao.findIndex(
                  (m) => m.key === item.key,
                );

                if (existingIndex !== -1) {
                  const existingMetaIndex = manutencao[
                    existingIndex
                  ].children.findIndex((m) => m.key === meta.key);

                  if (existingMetaIndex !== -1) {
                    manutencao[existingIndex].children[
                      existingMetaIndex
                    ].children.push({
                      key: task.key,
                      label: task.label,
                      disabled: task.disabled,
                    });
                  } else {
                    manutencao[existingIndex].children.push({
                      key: meta.key,
                      label: meta.label,
                      children: [
                        {
                          key: task.key,
                          label: task.label,
                          disabled: task.disabled,
                        },
                      ],
                    });
                  }
                } else {
                  manutencao.push({
                    key: item.key,
                    label: item.label,
                    children: [
                      {
                        key: meta.key,
                        label: meta.label,
                        children: [
                          {
                            key: task.key,
                            label: task.label,
                            disabled: task.disabled,
                          },
                        ],
                      },
                    ],
                  });
                }
              }
            }
          });
        });
      });
    });

    // Remove apenas as tarefas que foram movidas para manutenção do array original
    node.forEach((group) => {
      group.forEach((item) => {
        item.data = item.key;

        item.children.forEach((meta) => {
          meta.data = meta.key;

          meta.children = meta.children.filter((task) => {
            task.data = task.key;
            const taskKey = `${task.key}`;

            delete task.children;
            return !(taskCompletionCount[taskKey] === 3);
          });
        });
      });
    });

    return {
      manutencao,
      atividades: node[0],
    };
  }

  async updateMaintenance(pacienteId: number, calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const sessions = await prisma.sessao.findMany({
      select: {
        sessao: true,
      },
      where: {
        pacienteId,
      },
      orderBy: {
        id: 'desc', 
      },
      take: 3,
    });

    const flat = sessions.flat();

    const formatted = await Promise.all(
      flat.map((session: any) => {
        return session.sessao;
      }),
    );

    const result = this.processActivities(formatted);

    if (result.manutencao.length) {
      this.updateAtividadeSessao({
        maintenance: result.manutencao,
        atividades: result.atividades,
        calendarioId,
      });
    }
  }

  async updateSumary(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.sessao.update({
      data: body,
      where: {
        id: body.id,
      },
    });
  }

  async createProtocolo(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.protocolo.createMany({
      data: body,
    });
  }

  async createAtividadeSessao(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.createMany({
      data: body,
    });
  }

  async updateAtividadeSessao(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.update({
      data: {
        ...body,
      },
      where: {
        calendarioId: body.calendarioId,
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.sessao.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getProtocoloByPacient(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const result: any = await prisma.protocolo.findMany({
      select: {
        id: true,
        protocolo: true,
        protocoloSet: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const last = result.at(-1);
    return {
      ...last,
      protocolo: JSON.parse(last.protocolo),
      protocoloSet: JSON.parse(last.protocoloSet),
    };
  }

  async getAtividadeSessaoByPacient(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      const result: any = await prisma.sessao.findMany({
        select: {
          sessao: true,
          createdAt: true,
          evento: true,
        },
        where: {
          pacienteId: Number(pacienteId),
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const sessoes = [];
      await Promise.all(
        result.map((item: any) => {
          const programas = Array.isArray(item.sessao)
            ? item.sessao
            : JSON.parse(item.sessao);

          programas.map((programa: any) => {
            let current = [];
            const metas = programa.children;
            metas.map((meta: any) => {
              const subtItem = meta.children;

              subtItem.map((sub: any) => {
                current.push({
                  programa: sub.label,
                  primeiraResposta: sub.children[0] === TYPE_DTT.c,
                  data: dateFormatDDMMYYYY(item.evento.dataInicio),
                  porcentagem: calcAcertos(sub.children),
                });
              });
            });

            sessoes.push({
              programa: programa.label,
              children: current,
            });
          });

          delete item.evento;
        }),
      );

      const programasFormatados = [];

      await Promise.all(
        sessoes.map((item: any) => {
          const formatted = [];

          let qtdColumns = 0;

          item.children.map((meta: any) => {
            const se = formatted.filter(
              (sessao: any) => sessao.programa === meta.programa,
            )[0];

            if (Boolean(se)) {
              se.dias.push({
                primeiraResposta: meta.primeiraResposta,
                data: meta.data,
                porcentagem: meta.porcentagem,
              });
            } else {
              formatted.push({
                programa: meta.programa,

                dias: [
                  {
                    primeiraResposta: meta.primeiraResposta,
                    data: meta.data,
                    porcentagem: meta.porcentagem,
                  },
                ],
              });
            }

            if (Boolean(se)) {
              qtdColumns =
                se.dias.length > qtdColumns ? se.dias.length : qtdColumns;
            } else {
              formatted.map((column) => {
                qtdColumns =
                  column.dias.length > qtdColumns
                    ? column.dias.length
                    : qtdColumns;
              });
            }
          });

          programasFormatados.push({
            programa: item.programa,
            children: formatted,
            qtdColumns,
          });
        }),
      );

      const groupedData = programasFormatados.reduce((acc, current) => {
        const programa = current.programa;
        const existingProgram = acc.find((item) => item.programa === programa);

        if (existingProgram) {
          current.children.forEach((child) => {
            const existingChild = existingProgram.children.find(
              (c) => c.programa === child.programa,
            );
            if (existingChild) {
              existingChild.dias.push(...child.dias);
            } else {
              existingProgram.children.push({ ...child });
            }
          });

          // Atualiza qtdColumns para o maior tamanho de dias encontrado
          existingProgram.qtdColumns = Math.max(
            ...existingProgram.children.map((child) => child.dias.length),
          );
        } else {
          // Inicia qtdColumns com o tamanho do primeiro children
          const qtdColumns = Math.max(
            ...current.children.map((child) => child.dias.length),
          );
          acc.push({
            programa: programa,
            children: [...current.children],
            qtdColumns: qtdColumns,
          });
        }

        return acc;
      }, []);

      // const groupedData = programasFormatados.reduce((acc, current) => {
      //   const programa = current.programa;
      //   const existingProgram = acc.find((item) => item.programa === programa);

      //   if (existingProgram) {
      //     current.children.forEach((child) => {
      //       const existingChild = existingProgram.children.find(
      //         (c) => c.programa === child.programa,
      //       );
      //       if (existingChild) {
      //         existingChild.dias.push(...child.dias);
      //       } else {
      //         existingProgram.children.push({ ...child });
      //       }
      //     });
      //   } else {
      //     acc.push({
      //       programa: programa,
      //       children: [...current.children],
      //       qtdColumns: current.qtdColumns,
      //     });
      //   }

      //   return acc;
      // }, []);

      return groupedData;
    } catch (error) {
      console.log(error);
    }
  }
}
