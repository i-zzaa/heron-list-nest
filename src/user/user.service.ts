import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { moneyFormat } from 'src/util/util';
import { UserProps } from './user.interface';
import * as bcrypt from 'bcryptjs';
import { ID_PERFIL_TERAPEUTA } from 'src/terapeuta/terapeuta.interface';
import { messageError } from 'src/util/message.response';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserAuth(username: string): Promise<any | undefined> {
    const prisma = this.prismaService.getPrismaClient();

    const user: UserProps = await prisma.usuario.findFirstOrThrow({
      select: {
        id: true,
        nome: true,
        login: true,
        senha: true,
        perfil: true,
        ativo: true,
        grupoPermissaoId: true,
        grupo: {
          select: {
            permissoes: {
              select: {
                permissao: {
                  select: {
                    cod: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        login: username,
      },
    });

    if (user) {
      user.permissoes = user.grupo.permissoes;
      delete user.grupo;
    }

    return user;
  }

  async getAll(page: number, pageSize: number): Promise<any | undefined> {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [usuarios, totalItems]: any = await Promise.all([
      prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          login: true,
          perfil: true,
          grupoPermissaoId: true,
          ativo: true,
          grupo: {
            select: {
              permissoes: {
                select: {
                  permissao: true,
                },
              },
            },
          },
          terapeuta: {
            include: {
              especialidade: {
                select: {
                  nome: true,
                  id: true,
                },
              },
              funcoes: {
                include: {
                  funcao: true,
                },
              },
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
        where: {
          ativo: true,
          NOT: {
            perfil: {
              nome: {
                in: ['developer', 'Developer'],
              },
            },
          },
        },
        skip,
        take: pageSize,
      }),
      prisma.usuario.count(),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const data = await this.formatUsers(usuarios);

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data, pagination };
  }

  async formatUsers(usuarios: any) {
    return await Promise.all(
      usuarios.map((usuario: any) => {
        const funcoesId = usuario?.terapeuta?.funcoes.map((funcao: any) => {
          return {
            nome: funcao.funcao.nome,
            id: funcao.funcao.id,
          };
        });

        const permissoesId = usuario?.grupo?.permissoes.map(
          ({ permissao }: any) => permissao.id,
        );

        delete usuario.grupo;

        if (usuario?.terapeuta?.fazDevolutiva) {
          usuario.devolutiva = usuario?.terapeuta?.fazDevolutiva;
        }

        if (usuario?.terapeuta?.cargaHoraria) {
          usuario.cargaHoraria = JSON.parse(usuario.terapeuta?.cargaHoraria);
        }

        if (usuario?.terapeuta?.funcoes) {
          usuario.comissao = usuario?.terapeuta?.funcoes.map((funcao: any) => {
            const valor = parseFloat(funcao.comissao.replace(',', '.'));

            const comissao =
              funcao.tipo === 'Fixo'
                ? moneyFormat.format(valor)
                : funcao.comissao;

            return {
              funcaoId: funcao.funcaoId,
              valor: comissao,
              tipo: funcao.tipo,
              funcao: funcao.funcao.nome,
            };
          });
        }

        return {
          ...usuario,
          especialidadeId: usuario?.terapeuta?.especialidade,
          permissoesId: permissoesId,
          funcoesId: funcoesId,
        };
      }),
    );
  }

  async getUser(login: string) {
    const prisma = this.prismaService.getPrismaClient();

    const user: any = await prisma.usuario.findUniqueOrThrow({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
        grupo: {
          select: {
            permissoes: {
              select: {
                permissao: true,
              },
            },
          },
        },
      },
      where: {
        login: login,
      },
    });

    if (user) {
      user.permissoes = user.grupo.permissoes;
      delete user.grupo;
    }

    return user;
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    const usuarios: any = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
        grupo: {
          select: {
            permissoes: {
              select: {
                permissao: true,
              },
            },
          },
        },
        terapeuta: {
          include: {
            especialidade: {
              select: {
                nome: true,
                id: true,
              },
            },
            funcoes: {
              include: {
                funcao: true,
              },
            },
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        OR: [
          {
            nome: {
              contains: word,
            },
          },
          {
            login: { contains: word },
          },
        ],
        NOT: {
          perfil: {
            nome: {
              in: ['developer', 'Developer'],
            },
          },
        },
      },
    });

    const data = await this.formatUsers(usuarios);

    return data;
  }

  async createTerapeuta(body: any, id: number) {
    const prisma = this.prismaService.getPrismaClient();

    await prisma.terapeuta.create({
      data: {
        usuarioId: id,
        especialidadeId: body.especialidadeId,
        fazDevolutiva: body.devolutiva,
        cargaHoraria: JSON.stringify(body.cargaHoraria),
      },
    });

    await prisma.terapeutaOnFuncao.createMany({
      data: [
        ...body.comissao.map((comissao: any) => {
          const formatComissao =
            typeof comissao.valor === 'string'
              ? comissao.valor.split('R$')[1]
              : comissao.valor.toString();

          return {
            terapeutaId: id,
            funcaoId: comissao.funcaoId,
            comissao: formatComissao,
            tipo: comissao.tipo,
          };
        }),
      ],
    });
  }

  async updateTerapeuta(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    if (body?.comissao?.length) {
      await prisma.terapeutaOnFuncao.deleteMany({
        where: {
          terapeutaId: body.id,
        },
      });

      await prisma.terapeutaOnFuncao.createMany({
        data: [
          ...body.comissao.map((comissao: any) => {
            const formatComissao =
              typeof comissao.valor === 'string'
                ? comissao.valor.split('R$')[1]
                : comissao.valor.toString();

            return {
              terapeutaId: body.id,
              funcaoId: comissao.funcaoId,
              comissao: formatComissao,
              tipo: comissao.tipo,
            };
          }),
        ],
      });
    }

    await prisma.terapeuta.update({
      data: {
        especialidadeId: body.especialidadeId,
        fazDevolutiva: body.devolutiva,
        cargaHoraria: JSON.stringify(body.cargaHoraria),
      },
      where: {
        usuarioId: body.id,
      },
    });
  }

  async removeTerapeuta(usuarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await Promise.all([
      prisma.terapeuta.delete({
        where: {
          usuarioId,
        },
      }),
      prisma.terapeutaOnFuncao.deleteMany({
        where: {
          terapeutaId: usuarioId,
        },
      }),
    ]);
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    body.senha = bcrypt.hashSync('12345678', 8);

    const user: UserProps = await prisma.usuario.create({
      select: {
        nome: true,
        login: true,
        id: true,
        perfil: true,
      },
      data: {
        nome: body.nome.toUpperCase(),
        login: body.login.toLowerCase(),
        perfilId: body.perfilId,
        senha: body.senha,
        grupoPermissaoId: body.grupoPermissaoId,
      },
    });

    if (body.perfilId === ID_PERFIL_TERAPEUTA.id) {
      await this.createTerapeuta(body, user.id);
    }

    if (!user) return messageError();
    delete user.senha;
    return user;
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    if (!body.ativo) {
      return await prisma.usuario.update({
        data: {
          ativo: false,
        },
        where: {
          id: body.id,
        },
      });
    }

    // verifica tem terapeuta criada
    const terapeuta = await prisma.terapeuta.findUnique({
      where: {
        usuarioId: body.id,
      },
    });

    switch (body.perfilId) {
      case ID_PERFIL_TERAPEUTA.id:
        if (!!terapeuta) {
          await this.updateTerapeuta(body);
        } else {
          await this.createTerapeuta(body, body.id);
        }
        break;

      default:
        if (!!terapeuta) {
          await this.removeTerapeuta(body.id);
        }
        break;
    }

    const user = await prisma.usuario.update({
      select: {
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
      },
      data: {
        nome: body.nome,
        login: body.login,
        perfilId: Number(body.perfilId),
        ativo: body.ativo,
      },
      where: {
        id: body.id,
      },
    });

    return user;
  }

  async updatePassword(userId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const senha = bcrypt.hashSync('12345678', 8);
    const user = await prisma.usuario.update({
      data: {
        senha: senha,
      },
      where: {
        id: Number(userId),
      },
    });

    return user;
  }

  async updatePasswordLogin(login: string, data: any) {
    const prisma = this.prismaService.getPrismaClient();

    const senha = bcrypt.hashSync(data.senha.toString(), 8);

    const user = await prisma.usuario.update({
      data: {
        senha: senha,
      },
      where: {
        login,
      },
    });

    return {};
  }
}
