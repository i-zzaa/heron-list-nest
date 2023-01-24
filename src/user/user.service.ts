import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ERROR_CREATE } from 'src/utils/message.response';
import {
  ComissaoProps,
  CreateUserProps,
  TerapeutaProps,
  UserProps,
  UserServiceInterface,
} from './user.interface';
import createError from 'http-errors';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService implements UserServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async getUsers(): Promise<any[]> {
    const usuarios = await this.prismaService.usuario.findMany({
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
    });

    const format = usuarios.map((usuario: any) => {
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

      return {
        ...usuario,
        especialidadeId: usuario?.terapeuta?.especialidade,
        permissoesId: permissoesId,
        funcoesId: funcoesId,
      };
    });

    return format || [];
  }

  async getUser(login: string): Promise<UserProps> {
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

  async createUser(body: CreateUserProps): Promise<UserProps> {
    console.log(body);

    body.senha = bcrypt.hashSync('12345678', 8);

    const user: UserProps = await this.prismaService.usuario.create({
      select: {
        nome: true,
        login: true,
        id: true,
        perfil: true,
        permissoes: true,
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

    if (user.perfil?.nome === 'Terapeuta') {
      await this.prismaService.terapeuta.create({
        data: {
          usuarioId: user.id,
          especialidadeId: body.especialidadeId,
          fazDevolutiva: body.devolutiva,
          cargaHoraria: JSON.stringify(body.cargaHoraria),
        },
      });

      await this.prismaService.terapeutaOnFuncao.createMany({
        data: [
          ...body.comissao.map((comissao: ComissaoProps) => {
            return {
              terapeutaId: user.id,
              funcaoId: comissao.funcaoId,
              comissao: comissao.comissao,
              tipo: comissao.tipo,
            };
          }),
        ],
      });
    }

    if (!user) throw createError(500, ERROR_CREATE);
    delete user.senha;

    return user;
  }

  async getTerapeuta(): Promise<TerapeutaProps[]> {
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

  async updateUser(body: any) {
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

    if (body.perfilId === 6) {
      //Terapeuta

      if (body?.comissao?.length) {
        await this.prismaService.terapeutaOnFuncao.deleteMany({
          where: {
            terapeutaId: body.id,
          },
        });

        await this.prismaService.terapeutaOnFuncao.createMany({
          data: [
            ...body.comissao.map((comissao: any) => {
              return {
                funcaoId: comissao.funcaoId,
                terapeutaId: body.id,
                valor: comissao.valor,
                tipo: comissao.tipo,
              };
            }),
          ],
        });
      }

      await this.prismaService.terapeuta.update({
        data: {
          especialidadeId: body.especialidadeId,
          fazDevolutiva: body.fazDevolutiva,
          cargaHoraria: body.cargaHoraria,
        },
        where: {
          usuarioId: body.id,
        },
      });
    }
  }

  async updatePassword(userId: number) {
    const senha = bcrypt.hashSync('12345678', 8);
    await this.prismaService.usuario.update({
      data: {
        senha: senha,
      },
      where: {
        id: Number(userId),
      },
    });
  }

  async updatePasswordLogin(login: string, updatePassword: string) {
    const senha = bcrypt.hashSync(updatePassword.toString(), 8);

    await this.prismaService.usuario.update({
      data: {
        senha: senha,
      },
      where: {
        login,
      },
    });
  }

  async searchUsers(word: string): Promise<UserProps[]> {
    return await this.prismaService.usuario.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
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
}
