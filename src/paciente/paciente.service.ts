import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';
import {
  calculaIdade,
  dateFormatYYYYMMDD,
  formatadataPadraoBD,
} from 'src/util/format-date';
import { moneyFormat } from 'src/util/util';
import { PatientCreate, PatientProps } from './paciente.interface';
import { TerapeutaService } from 'src/terapeuta/terapeuta.service';

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
          true,
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

  async getConvenio(pacienteId: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.paciente.findUniqueOrThrow({
      select: {
        convenio: true,
      },
      where: {
        id: pacienteId,
      },
    });
  }

  async getPacienteEspecialidade(
    statusPacienteCod: string,
    pacienteId: number,
  ) {
    const prisma = this.prismaService.getPrismaClient();

    const paciente = await prisma.paciente.findUniqueOrThrow({
      select: {
        emAtendimento: true,
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

    const result = await Promise.all(
      paciente.vaga.especialidades.map((especialidade: any) => {
        return {
          id: especialidade.especialidade.id,
          nome: especialidade.especialidade.nome,
        };
      }),
    );

    return result;
  }

  async getPatientsQueue(
    page: number,
    pageSize: number,
    statusPacienteCod: string[],
    naFila?: boolean,
  ) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.paciente.findMany({
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
        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.paciente.findMany({
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
    ]);

    const pacientes: any = data ? await this.formatPatients(data) : [];

    const totalPages =
      totalItems.length < 10 ? 1 : Math.ceil(totalItems.length / pageSize); // Calcula o total de páginas

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data: pacientes || [], pagination };
  }

  async getPatientId(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.paciente.findFirstOrThrow({
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
    const prisma = this.prismaService.getPrismaClient();

    const paciente: any = await prisma.paciente.update({
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
    const prisma = this.prismaService.getPrismaClient();

    const paciente: any = await prisma.paciente.update({
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
    const prisma = this.prismaService.getPrismaClient();

    try {
      const pacientes = await Promise.all(
        patients.map(async (patient: any) => {
          const paciente = { ...patient };
          const especialidades = paciente.vaga.especialidades;

          const sessao = await Promise.all(
            especialidades.map((especialidade: any) => {
              const valor = parseFloat(especialidade.valor.replace(',', '.'));
              return {
                especialidade: especialidade.especialidade.nome,
                especialidadeId: especialidade.especialidadeId,
                valor: moneyFormat.format(valor),
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
    const prisma = this.prismaService.getPrismaClient();

    const statusPacienteCods =
      this.setFilterstatusPacienteCod(statusPacienteCod);

    return await prisma.paciente.findMany({
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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.findMany({
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

  async create(body: PatientCreate) {
    const prisma = this.prismaService.getPrismaClient();

    const dataContato =
      body?.dataContato ||
      body?.dataVoltouAba ||
      dateFormatYYYYMMDD(new Date());

    const tipoSessaoId = body?.tipoSessaoId || 2;
    const naFila = body.statusPacienteCod !== STATUS_PACIENT_COD.crud_therapy; // CRIAR NA FILA TRUE SEMPRE QUE NAO FOR DA TELA  CADASTRO DO PACIENTE

    const paciente: any = await prisma.paciente.create({
      data: {
        nome: body.nome.toUpperCase(),
        telefone: body.telefone,
        responsavel: body.responsavel.toUpperCase(),
        disabled: false,
        convenioId: body.convenioId,
        dataNascimento: body.dataNascimento,
        statusPacienteCod: body.statusPacienteCod,
        statusId: body?.statusId,
        tipoSessaoId: tipoSessaoId,
        carteirinha: body.carteirinha,
        vaga: {
          create: {
            dataContato: dataContato,
            observacao: body?.observacao,
            naFila: naFila,
            periodoId: body.periodoId,
            especialidades: {
              create: [
                ...body.sessao.map((sessao: any) => {
                  const valor = sessao.valor.split('R$')[1];

                  console.log(valor);

                  return {
                    especialidadeId: sessao.especialidadeId,
                    valor: valor,
                    km: sessao.km.toString(),
                    agendado: false, // se for 2, é para cadastrar como nao agendado
                    dataAgendado: '',
                  };
                }),
              ],
            },
          },
        },
      },
    });
    return paciente;
  }

  async update(body: any) {
    switch (body.statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
      case STATUS_PACIENT_COD.queue_therapy:
      case STATUS_PACIENT_COD.crud_therapy:
        return this.updatePatient(body);
      case STATUS_PACIENT_COD.queue_devolutiva:
        return this.updatePatient({
          ...body,
          dataVoltouAba: formatadataPadraoBD(new Date()),
          tipoSessaoId: 3,
          statusPacienteCod: STATUS_PACIENT_COD.queue_therapy,
        });
      default:
        break;
    }
  }

  async updatePatient(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      const [, , especialidades] = await prisma.$transaction([
        prisma.paciente.update({
          data: {
            nome: body.nome.toUpperCase(),
            telefone: body.telefone,
            responsavel: body.responsavel.toUpperCase(),
            convenioId: body.convenioId,
            dataNascimento: body.dataNascimento,
            tipoSessaoId: body.tipoSessaoId,
            statusId: body.statusId,
            carteirinha: body.carteirinha,
            statusPacienteCod: body.statusPacienteCod,
            vaga: {
              update: {
                periodoId: body.periodoId,
                observacao: body.observacao,
                dataContato: body.dataContato ? body.dataContato : '',
                dataVoltouAba: body.dataVoltouAba || '',
              },
            },
          },
          where: {
            id: body.id,
          },
        }),
        prisma.vagaOnEspecialidade.deleteMany({
          where: {
            vagaId: body.vagaId,
            agendado: false,
            NOT: {
              especialidadeId: {
                in: body.especialidades,
              },
            },
          },
        }),
        prisma.vagaOnEspecialidade.findMany({
          select: {
            especialidadeId: true,
            valor: true,
            km: true,
          },
          where: {
            vagaId: body.vagaId,
          },
        }),
      ]);

      const arrEspecialidade = especialidades.map(
        (especialidade: any) => especialidade.especialidadeId,
      );

      await Promise.all(
        body.sessao.map(async (especialidade: any) => {
          const formatSessao =
            typeof especialidade.valor === 'string'
              ? especialidade.valor.split('R$')[1]
              : especialidade.valor;

          if (!arrEspecialidade.includes(especialidade.especialidadeId)) {
            await prisma.vagaOnEspecialidade.create({
              data: {
                vagaId: body.vagaId,
                agendado: false,
                especialidadeId: especialidade.especialidadeId,
                valor: formatSessao,
              },
            });
          } else {
            await prisma.vagaOnEspecialidade.updateMany({
              data: {
                vagaId: body.vagaId,
                agendado: false,
                valor: formatSessao,
              },
              where: {
                vagaId: body.vagaId,
                especialidadeId: especialidade.especialidadeId,
              },
            });
          }
        }),
      );

      return [];
    } catch (error) {
      console.log(error);
    }
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getPatientsActived() {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.paciente.findMany({
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

  async getPatientsEspcialidades(
    statusPacienteCod: string,
    pacienteId: number,
  ) {
    const prisma = this.prismaService.getPrismaClient();

    const vagas: any = await prisma.paciente.findUnique({
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
        id: Number(pacienteId),
      },
    });

    const terapeutasAll = await this.getTerapeutaByEspecialidade();

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
    const prisma = this.prismaService.getPrismaClient();

    await prisma.paciente.update({
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
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.paciente.findMany({
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
        // orderBy: {
        //   vaga: {
        //     dataContato: 'asc',
        //   },
        // },

        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.paciente.findMany({
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
      }),
    ]);

    const pacientes: any = data ? await this.formatPatients(data) : [];
    const totalPages =
      totalItems.length < 10 ? 1 : Math.ceil(totalItems.length / pageSize); // Calcula o total de páginas

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data: pacientes || [], pagination };
  }
}
