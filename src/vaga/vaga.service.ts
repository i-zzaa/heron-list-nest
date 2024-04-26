import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AgendarEspecialidadeProps,
  VagaEspecialidadeProps,
} from './vaga.interface';
import { calculaData, formatadataPadraoBD } from 'src/util/format-date';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';
import { PacienteService } from 'src/paciente/paciente.service';

@Injectable()
export class VagaService {
  constructor(
    private readonly prismaService: PrismaService,
    private pacienteService: PacienteService,
  ) {}

  async update(body: VagaEspecialidadeProps) {
    const dataAgendado = formatadataPadraoBD(new Date());
    const prisma = this.prismaService.getPrismaClient();

    if (body.agendar.length) {
      switch (body.statusPacienteCod) {
        case STATUS_PACIENT_COD.queue_avaliation:
          await Promise.all([
            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: true,
                dataAgendado: dataAgendado,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.agendar,
                },
              },
            }),
            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.queue_avaliation,
              STATUS_PACIENT_COD.avaliation,
            ),
          ]);
        case STATUS_PACIENT_COD.avaliation:
          await Promise.all([
            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: true,
                dataAgendado: dataAgendado,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.agendar,
                },
              },
            }),
            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.avaliation,
              STATUS_PACIENT_COD.queue_devolutiva,
            ),
          ]);
          break;
        case STATUS_PACIENT_COD.queue_devolutiva:
          await Promise.all([
            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: true,
                dataAgendado: dataAgendado,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.agendar,
                },
              },
            }),
            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.devolutiva,
              STATUS_PACIENT_COD.devolutiva,
            ),
          ]);

          break;
        case STATUS_PACIENT_COD.queue_therapy:
        case STATUS_PACIENT_COD.crud_therapy:
        case STATUS_PACIENT_COD.therapy:
          const [, , now] = await Promise.all([
            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: true,
                dataAgendado: dataAgendado,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.agendar,
                },
              },
            }),
            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.devolutiva,
              STATUS_PACIENT_COD.devolutiva,
            ),
            body.statusPacienteCod === STATUS_PACIENT_COD.crud_therapy
              ? STATUS_PACIENT_COD.crud_therapy
              : STATUS_PACIENT_COD.therapy,
          ]);

          this.setQueueStatus(
            body.vagaId,
            body.pacienteId,
            body.statusPacienteCod,
            now,
          );

          break;
        default:
          break;
      }
    }

    if (body.desagendar.length) {
      switch (body.statusPacienteCod) {
        case STATUS_PACIENT_COD.queue_avaliation:
        case STATUS_PACIENT_COD.avaliation:
          const [, , , isQueueAvaliation] = await Promise.all([
            this.removeEvents(
              body.pacienteId,
              body.statusPacienteCod,
              body.desagendar,
            ),

            await prisma.vaga.update({
              data: {
                dataRetorno: dataAgendado,
                naFila: true,
              },
              where: {
                id: body.vagaId,
              },
            }),

            await prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: false,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.desagendar,
                },
              },
            }),

            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.queue_avaliation,
              STATUS_PACIENT_COD.avaliation,
            ),
          ]);

          return isQueueAvaliation;
        case STATUS_PACIENT_COD.queue_devolutiva:
          await prisma.vaga.update({
            data: {
              dataRetorno: dataAgendado,
              naFila: true,
            },
            where: {
              id: body.vagaId,
            },
          });

          const [, , isQueueDevolutiva] = await Promise.all([
            this.removeEvents(
              body.pacienteId,
              body.statusPacienteCod,
              body.desagendar,
            ),

            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: false,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.desagendar,
                },
              },
            }),
            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.queue_avaliation,
              STATUS_PACIENT_COD.avaliation,
            ),
          ]);

          return isQueueDevolutiva;
        case STATUS_PACIENT_COD.devolutiva:
          const [, , , isQueue] = await Promise.all([
            this.removeEvents(
              body.pacienteId,
              body.statusPacienteCod,
              body.desagendar,
            ),
            prisma.vaga.update({
              data: {
                dataRetorno: dataAgendado,
                naFila: true,
              },
              where: {
                id: body.vagaId,
              },
            }),

            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: false,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.desagendar,
                },
              },
            }),
            this.setQueueStatus(
              body.vagaId,
              body.pacienteId,
              STATUS_PACIENT_COD.devolutiva,
              STATUS_PACIENT_COD.queue_devolutiva,
            ),
          ]);
          return isQueue;

        case STATUS_PACIENT_COD.queue_therapy:
        case STATUS_PACIENT_COD.crud_therapy:
        case STATUS_PACIENT_COD.therapy:
          const [, , now] = await Promise.all([
            prisma.vaga.update({
              data: {
                // dataVoltouAba: dataAgendado,
                naFila: true,
              },
              where: {
                id: body.vagaId,
              },
            }),
            prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: false,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: {
                  in: body.desagendar,
                },
              },
            }),
            body.statusPacienteCod === STATUS_PACIENT_COD.crud_therapy
              ? STATUS_PACIENT_COD.crud_therapy
              : STATUS_PACIENT_COD.queue_therapy,
          ]);

          const isQueueTherapy = this.setQueueStatus(
            body.vagaId,
            body.pacienteId,
            body.statusPacienteCod,
            now,
          );
          return isQueueTherapy;
      }
    }

    await prisma.pacienteHistorico.create({
      data: {
        historico: JSON.stringify(body),
        pacienteId: body.pacienteId,
      },
    });
  }

  async verifyInFila(vagaId: number, dataAgendado: string) {
    const prisma = this.prismaService.getPrismaClient();

    let naFila = false;

    const vagaOnEspecialidade: any = await prisma.vagaOnEspecialidade.aggregate(
      {
        _count: {
          especialidadeId: true,
        },
        where: {
          vagaId: vagaId,
          agendado: false,
        },
      },
    );

    naFila = vagaOnEspecialidade._count.especialidadeId !== 0;

    if (!naFila) {
      const { dataContato }: any = await prisma.vaga.findUniqueOrThrow({
        select: {
          dataContato: true,
        },
        where: {
          id: vagaId,
        },
      });

      const diff = calculaData(dataAgendado, dataContato);
      await prisma.vaga.update({
        data: {
          // naFila: naFila,
          dataSaiuFila: dataAgendado,
          diff: diff.toString(),
        },
        where: {
          id: vagaId,
        },
      });
    }

    return naFila;
  }

  async setQueueStatus(
    vagaId: number,
    pacienteId: number,
    statusOne: string,
    statusTwo: string,
  ) {
    const dataAgendado = formatadataPadraoBD(new Date());

    const isQueue = await this.verifyInFila(vagaId, dataAgendado);

    await this.pacienteService.setStatusPaciente(
      isQueue ? statusOne : statusTwo,
      pacienteId,
    );

    if (
      (isQueue && statusTwo !== STATUS_PACIENT_COD.avaliation) ||
      statusTwo !== STATUS_PACIENT_COD.queue_avaliation
    ) {
      await this.pacienteService.setTipoSessaoTerapia(pacienteId);
    }

    return isQueue;
  }

  async updateReturn({ id, devolutiva }: any) {
    const prisma = this.prismaService.getPrismaClient();

    const dataDevolutiva = formatadataPadraoBD(new Date());
    await prisma.vaga.update({
      data: {
        devolutiva: devolutiva,
        dataDevolutiva,
      },
      where: {
        id: id,
      },
    });

    let statusPacienteCodTemp: string = STATUS_PACIENT_COD.queue_therapy;

    if (!devolutiva) {
      const { statusPacienteCod }: any =
        await this.pacienteService.getPatientId(id);
      statusPacienteCodTemp =
        statusPacienteCod === STATUS_PACIENT_COD.queue_therapy
          ? STATUS_PACIENT_COD.queue_avaliation
          : STATUS_PACIENT_COD.queue_therapy;
    }

    await this.pacienteService.setStatusPaciente(statusPacienteCodTemp, id);
  }

  async updateEspecialidadeVaga({
    vagaId,
    especialidadeId,
    statusPacienteCod,
    pacienteId,
    especialidades,
  }: AgendarEspecialidadeProps) {
    const prisma = this.prismaService.getPrismaClient();

    const dataAgendado = formatadataPadraoBD(new Date());

    switch (statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
        if (especialidadeId) {
          await prisma.vagaOnEspecialidade.updateMany({
            data: {
              agendado: true,
              dataAgendado,
            },
            where: {
              especialidadeId: especialidadeId,
              vagaId: vagaId,
            },
          });

          const isAvaliationQueue = await this.verifyInFila(
            vagaId,
            dataAgendado,
          );
          await this.pacienteService.setStatusPaciente(
            isAvaliationQueue
              ? STATUS_PACIENT_COD.avaliation
              : STATUS_PACIENT_COD.queue_devolutiva,
            pacienteId,
          );

          return isAvaliationQueue;
        }
        return null;
      case STATUS_PACIENT_COD.queue_devolutiva:
        if (especialidades?.length) {
          especialidades?.map(async (id: number) => {
            if (id === undefined) return;

            await prisma.vagaOnEspecialidade.updateMany({
              data: {
                agendado: true,
                dataAgendado,
              },
              where: {
                especialidadeId: id,
                vagaId: vagaId,
              },
            });
          });
        } else {
          await prisma.vagaOnEspecialidade.updateMany({
            data: {
              agendado: true,
              dataAgendado,
            },
            where: {
              especialidadeId: especialidadeId,
              vagaId: vagaId,
            },
          });
        }

        const isReturnQueue = await this.verifyInFila(vagaId, dataAgendado);
        await this.pacienteService.setStatusPaciente(
          STATUS_PACIENT_COD.devolutiva,
          pacienteId,
        );
        return isReturnQueue;
      case STATUS_PACIENT_COD.queue_therapy:
        await prisma.vagaOnEspecialidade.updateMany({
          data: {
            agendado: true,
            dataAgendado,
          },
          where: {
            especialidadeId: especialidadeId,
            vagaId: vagaId,
          },
        });
        const isTherapyQueue = await this.verifyInFila(vagaId, dataAgendado);
        if (!isTherapyQueue)
          await this.pacienteService.setStatusPaciente(
            STATUS_PACIENT_COD.therapy,
            pacienteId,
          );

        return isTherapyQueue;

      case STATUS_PACIENT_COD.crud_therapy:
        await prisma.vagaOnEspecialidade.updateMany({
          data: {
            agendado: true,
            dataAgendado,
          },
          where: {
            especialidadeId: especialidadeId,
            vagaId: vagaId,
          },
        });

        this.verifyInFila(vagaId, dataAgendado);

        return;
    }
  }

  async removeEvents(
    pacienteId: number,
    statusPacienteCod: string,
    especialidadeIds: number[],
  ) {
    let modalidade = '';
    const prisma = this.prismaService.getPrismaClient();

    switch (statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
      case STATUS_PACIENT_COD.avaliation:
      case STATUS_PACIENT_COD.queue_devolutiva:
        modalidade = 'Avaliação';
        break;
      case STATUS_PACIENT_COD.devolutiva:
        modalidade = 'Devolutiva';
        break;
      case STATUS_PACIENT_COD.queue_therapy:
        modalidade = 'Terapia';
        break;
    }

    const modalidadeDB = await prisma.modalidade.findFirst({
      where: {
        nome: modalidade,
      },
    });

    return await prisma.calendario.deleteMany({
      where: {
        pacienteId,
        especialidadeId: {
          in: especialidadeIds,
        },
        modalidadeId: modalidadeDB?.id,
      },
    });
  }
}
