import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserServiceInterface } from './user.interface';

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

  createUser(): string {
    return 'passando!';
  }

  getTerapeuta(): string {
    return 'passando!';
  }

  updateUser(): string {
    return 'passando!';
  }

  updatePassword(): string {
    return 'passando!';
  }

  updatePasswordLogin(): string {
    return 'passando!';
  }

  searchUsers(): string {
    return 'passando!';
  }
}
