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
    const user: UserProps = await this.prismaService.usuario.findFirstOrThrow({
      select: {
        id: true,
        nome: true,
        login: true,
        senha: true,
        perfil: true,
        ativo: true,
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
      where: {
        login: username,
      },
    });

    return user;
  }

  async getAll(page: number, pageSize: number): Promise<any | undefined> {
    const skip = (page - 1) * pageSize;

    const [usuarios, totalItems] = await Promise.all([
      this.prismaService.usuario.findMany({
        select: {
          id: true,
          nome: true,
          login: true,
          perfil: true,
          ativo: true,
          permissoes: {
            include: {
              permissao: true,
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
      this.prismaService.usuario.count(),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const data = await Promise.all(
      usuarios.map((usuario: any) => {
        const funcoesId = usuario?.terapeuta?.funcoes.map((funcao: any) => {
          return {
            nome: funcao.funcao.nome,
            id: funcao.funcao.id,
          };
        });

        const permissoesId = usuario?.permissoes.map(
          ({ permissao }: any) => permissao.id,
        );

        delete usuario.permissoes;

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

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data, pagination };
  }

  async getUser(login: string) {
    return await this.prismaService.usuario.findUniqueOrThrow({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
        permissoes: {
          select: {
            permissao: true,
          },
        },
      },
      where: {
        login: login,
      },
    });
  }

  async search(word: string) {
    return await this.prismaService.usuario.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
        permissoes: {
          select: {
            permissaoId: true,
          },
        },
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
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createTerapeuta(body: any, id: number) {
    await this.prismaService.terapeuta.create({
      data: {
        usuarioId: id,
        especialidadeId: body.especialidadeId,
        fazDevolutiva: body.devolutiva,
        cargaHoraria: JSON.stringify(body.cargaHoraria),
      },
    });

    await this.prismaService.terapeutaOnFuncao.createMany({
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
    if (body?.comissao?.length) {
      await this.prismaService.terapeutaOnFuncao.deleteMany({
        where: {
          terapeutaId: body.id,
        },
      });

      await this.prismaService.terapeutaOnFuncao.createMany({
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

    await this.prismaService.terapeuta.update({
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
    return await Promise.all([
      this.prismaService.terapeuta.delete({
        where: {
          usuarioId,
        },
      }),
      this.prismaService.terapeutaOnFuncao.deleteMany({
        where: {
          terapeutaId: usuarioId,
        },
      }),
    ]);
  }

  async create(body: any) {
    body.senha = bcrypt.hashSync('12345678', 8);

    const user: UserProps = await this.prismaService.usuario.create({
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
        permissoes: {
          create: [
            ...body.permissoesId.map((id: number) => {
              return {
                permissaoId: id,
              };
            }),
          ],
        },
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
    if (!body.ativo) {
      return await this.prismaService.usuario.update({
        data: {
          ativo: false,
        },
        where: {
          id: body.id,
        },
      });
    }

    if (body?.permissoesId) {
      await this.prismaService.usuarioOnPermissao.deleteMany({
        where: {
          usuarioId: body.id,
        },
      });

      await this.prismaService.usuarioOnPermissao.createMany({
        data: [
          ...body.permissoesId.map((permissao: number) => {
            return {
              permissaoId: permissao,
              usuarioId: body.id,
            };
          }),
        ],
      });
    }

    // verifica tem terapeuta criada
    const terapeuta = await this.prismaService.terapeuta.findUnique({
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

    const user = await this.prismaService.usuario.update({
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
    const senha = bcrypt.hashSync('12345678', 8);
    const user = await this.prismaService.usuario.update({
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
    const senha = bcrypt.hashSync(data.senha.toString(), 8);

    const user = await this.prismaService.usuario.update({
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
