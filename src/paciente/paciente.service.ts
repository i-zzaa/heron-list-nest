import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';
import { calculaIdade } from 'src/util/format-date';
import { moneyFormat } from 'src/util/util';

@Injectable()
export class PacienteService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(query: any, page: number, pageSize: number) {
    const statusPacienteCod = query.statusPacienteCod;
    switch (statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
        return this.getPatientsQueue(
          page,
          pageSize,
          [STATUS_PACIENT_COD.queue_avaliation, STATUS_PACIENT_COD.avaliation],
          true,
        );
      case STATUS_PACIENT_COD.queue_devolutiva:
        return this.getPatientsQueue(
          page,
          pageSize,
          [STATUS_PACIENT_COD.queue_devolutiva],
          false,
        );
      case STATUS_PACIENT_COD.queue_therapy:
        return this.getPatientsQueue(page, pageSize, [
          STATUS_PACIENT_COD.queue_therapy,
        ]);
      case STATUS_PACIENT_COD.crud_therapy:
        return this.getPatientsQueue(
          page,
          pageSize,
          [
            // STATUS_PACIENT_COD.therapy,
            // STATUS_PACIENT_COD.devolutiva,
            STATUS_PACIENT_COD.crud_therapy,
          ],
          false,
        );
      default:
        break;
    }
  }

  async getPatientsQueue(
    page: number,
    pageSize: number,
    statusPacienteCod: string[],
    naFila?: boolean,
  ) {
    const [data, totalItems] = await Promise.all([
      this.prismaService.paciente.findMany({
        select: {
          id: true,
          nome: true,
          telefone: true,
          responsavel: true,
          dataNascimento: true,
          convenio: true,
          disabled: true,
          tipoSessao: true,
          status: true,
          statusPacienteCod: true,
          carteirinha: true,
          vaga: {
            include: {
              periodo: true,
              especialidades: {
                include: {
                  especialidade: true,
                },
              },
            },
          },
        },
        where: {
          statusPacienteCod: {
            in: statusPacienteCod,
          },
          disabled: false,
          vaga: {
            naFila: naFila,
          },
        },
      }),
      this.prismaService.paciente.count(),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const pacientes: any = data ? await this.formatPatients(data) : [];

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data: pacientes || [], pagination };
  }

  async getPatientId(id: number) {
    return await this.prismaService.paciente.findFirstOrThrow({
      select: {
        id: true,
        nome: true,
        telefone: true,
        responsavel: true,
        dataNascimento: true,
        convenioId: true,
        statusId: true,
        statusPacienteCod: true,
        carteirinha: true,
      },
      where: {
        id,
      },
    });
  }

  async setTipoSessaoTerapia(pacienteId: number) {
    const paciente: any = await this.prismaService.paciente.update({
      data: {
        tipoSessaoId: 3,
      },
      where: {
        id: pacienteId,
      },
    });

    return paciente;
  }

  async setStatusPaciente(statusPacienteCod: string, pacienteId: number) {
    const paciente: any = await this.prismaService.paciente.update({
      data: {
        statusPacienteCod: statusPacienteCod,
      },
      where: {
        id: pacienteId,
      },
    });

    return paciente;
  }

  async formatPatients(patients: any) {
    try {
      const pacientes = await Promise.all(
        patients.map(async (patient: any) => {
          const paciente = { ...patient };
          const especialidades = paciente.vaga.especialidades;

          const sessao = await Promise.all(
            especialidades.map((especialidade: any) => {
              return {
                especialidade: especialidade.especialidade.nome,
                especialidadeId: especialidade.especialidadeId,
                valor: moneyFormat.format(parseFloat(especialidade.valor)),
              };
            }),
          );

          return {
            ...paciente,
            idade: calculaIdade(patient.dataNascimento),
            sessao,
          };
        }),
      );

      return pacientes;
    } catch (error) {
      console.log(error);
    }
  }

  async dropdown(statusPacienteCod: string) {
    const statusPacienteCods =
      this.setFilterstatusPacienteCod(statusPacienteCod);

    return await this.prismaService.paciente.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        statusPacienteCod: {
          in: statusPacienteCods,
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    return await this.prismaService.localidade.findMany({
      select: {
        id: true,
        casa: true,
        sala: true,
        ativo: true,
      },
      orderBy: {
        casa: 'asc',
      },
      where: {
        ativo: true,
        OR: [
          {
            casa: {
              contains: word,
            },
          },
          {
            sala: {
              contains: word,
            },
          },
        ],
      },
    });
  }

  async create(body: any) {
    return await this.prismaService.localidade.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.localidade.update({
      data: {
        casa: body.casa,
        sala: body.sala,
        ativo: body.ativo,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.localidade.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getPatientsActived() {
    return await this.prismaService.paciente.findMany({
      select: {
        nome: true,
        telefone: true,
        responsavel: true,
        statusPaciente: {
          select: {
            nome: true,
          },
        },
      },
      where: {
        disabled: false,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async getPatientsEspcialidades(
    statusPacienteCod: string,
    pacienteId: number,
  ) {
    const vagas: any = await this.prismaService.paciente.findFirstOrThrow({
      select: {
        vaga: {
          include: {
            especialidades: {
              include: {
                especialidade: true,
              },
              where: {
                agendado:
                  statusPacienteCod === STATUS_PACIENT_COD.queue_devolutiva,
              },
            },
          },
        },
      },
      where: {
        id: pacienteId,
      },
    });

    const TerapeutaService = require('src/terapeuta/terapeuta.service');

    const terapeutaService = new TerapeutaService();

    const terapeutasAll = await terapeutaService.getTerapeutaEspecialidade();
    const especialidades: any = await Promise.all(
      vagas.vaga.especialidades.map(
        ({ especialidade: { id, cor, nome } }: any) => {
          const terapeutas = terapeutasAll.filter((terapeuta: any) => {
            if (terapeuta.especialidadeId === id) {
              return {
                nome: terapeuta.nome,
                id: terapeuta.id,
              };
            }
          });

          return {
            especialidade: {
              id,
              nome,
              cor,
            },
            terapeutas,
          };
        },
      ),
    );

    return especialidades;
  }

  async updateDisabled({ id, disabled }: any) {
    await this.prismaService.paciente.update({
      data: {
        disabled: disabled,
      },
      where: {
        id: id,
      },
    });
  }

  setFilterstatusPacienteCod(statusPacienteCod: string) {
    switch (statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
        return [
          STATUS_PACIENT_COD.queue_avaliation,
          STATUS_PACIENT_COD.avaliation,
        ];
      case STATUS_PACIENT_COD.queue_therapy:
        return [
          STATUS_PACIENT_COD.queue_therapy,
          // STATUS_PACIENT_COD.therapy,
          STATUS_PACIENT_COD.devolutiva,
        ];
      case STATUS_PACIENT_COD.therapy:
        return [
          STATUS_PACIENT_COD.queue_avaliation,
          STATUS_PACIENT_COD.queue_devolutiva,
          STATUS_PACIENT_COD.queue_therapy,

          STATUS_PACIENT_COD.therapy,
          STATUS_PACIENT_COD.avaliation,
          STATUS_PACIENT_COD.devolutiva,
          STATUS_PACIENT_COD.crud_therapy,
        ];
      case STATUS_PACIENT_COD.avaliation:
        return [STATUS_PACIENT_COD.avaliation];

      case STATUS_PACIENT_COD.crud_therapy:
        return [STATUS_PACIENT_COD.therapy, STATUS_PACIENT_COD.crud_therapy];

      case STATUS_PACIENT_COD.queue_devolutiva:
        return [
          STATUS_PACIENT_COD.queue_devolutiva,
          STATUS_PACIENT_COD.devolutiva,
        ];
      case STATUS_PACIENT_COD.devolutiva:
        return [STATUS_PACIENT_COD.devolutiva];
    }
  }

  async filterSinglePatients(body: any, page: number, pageSize: number) {
    switch (body.statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
        return this.filterPatients(
          page,
          pageSize,
          [STATUS_PACIENT_COD.queue_avaliation, STATUS_PACIENT_COD.avaliation],
          body,
        );
      case STATUS_PACIENT_COD.queue_devolutiva:
      case STATUS_PACIENT_COD.devolutiva:
        if (body?.isDevolutiva) {
          return this.filterPatients(
            page,
            pageSize,
            [STATUS_PACIENT_COD.devolutiva],
            body,
          );
        }
        return this.filterPatients(
          page,
          pageSize,
          [STATUS_PACIENT_COD.queue_devolutiva],
          body,
        );
      default:
        return this.filterPatients(
          page,
          pageSize,
          [body.statusPacienteCod],
          body,
        );
    }
  }

  async filterPatients(
    page: number,
    pageSize: number,
    statusPacienteCod: string[],
    body: any,
  ) {
    const [data, totalItems] = await Promise.all([
      this.prismaService.paciente.findMany({
        select: {
          id: true,
          nome: true,
          telefone: true,
          responsavel: true,
          dataNascimento: true,
          convenio: true,
          disabled: true,
          statusPacienteCod: true,
          carteirinha: true,
          tipoSessao: true,
          status: true,
          vaga: {
            include: {
              periodo: true,
              especialidades: {
                include: {
                  especialidade: true,
                },
              },
            },
          },
        },
        where: {
          statusPacienteCod: {
            in: statusPacienteCod,
          },
          disabled: body.disabled,
          convenioId: body.convenios,
          tipoSessaoId: body.tipoSessoes,
          statusId: body.status,
          vaga: {
            pacienteId: body.pacientes,
            periodoId: body.periodos,
            // naFila: body.naFila,
            devolutiva: body.devolutiva,
            especialidades: {
              some: {
                especialidadeId: body.especialidades,
              },
            },
          },
        },
        orderBy: {
          vaga: {
            dataContato: 'asc',
          },
        },
      }),
      this.prismaService.paciente.count(),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const pacientes: any = data.length ? await this.formatPatients(data) : [];

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data: pacientes, pagination };
  }
}
