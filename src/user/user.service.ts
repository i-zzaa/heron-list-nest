import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DEVICE, DeviceProps, moneyFormat } from 'src/util/util';
import { UserProps } from './user.interface';

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

  async getUsers(page: number, pageSize: number): Promise<any | undefined> {
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
            const comissao =
              funcao.tipo === 'Fixo'
                ? moneyFormat.format(parseFloat(funcao.comissao))
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
}
