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
        selectedMaintenanceKeys: true,
      },
      where: {
        calendarioId: Number(calendarioId),
      },
    });

    if (Boolean(data?.sessao)) {
      data.sessao = JSON.parse(data.sessao);
      data.selectedMaintenanceKeys = JSON.parse(data.selectedMaintenanceKeys);
      data.maintenance = JSON.parse(data.maintenance);
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

    return await prisma.sessao.create({
      data: {
        ...body,
        calendarioId: evento.id,
      },
    });
  }

  async updateMaintenance(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const sessions = await prisma.sessao.findMany({
      where: {
        pacienteId,
      },
      orderBy: {
        id: 'desc', // Substitua 'id' pelo campo que deseja usar para ordenar os registros
      },
      take: 3,
    });
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

  async update(body: any) {
    // return await this.prismaService.periodo.update({
    //   data: {
    //     nome: body.nome,
    //   },
    //   where: {
    //     id: Number(body.id),
    //   },
    // });
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
                  data: dateFormatDDMMYYYY(item.createdAt),
                  porcentagem: calcAcertos(sub.children),
                });
              });
            });

            sessoes.push({
              programa: programa.label,
              children: current,
            });
          });
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
