import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { moneyFormat, PERFIL } from 'src/util/util';
import { UserProps } from './user.interface';
import * as bcrypt from 'bcryptjs';
import { ID_PERFIL_TERAPEUTA } from 'src/terapeuta/terapeuta.interface';
import { messageError } from 'src/util/message.response';
import { getPrismaClient } from 'src/util/crud';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';
import { normalizeCurrencyValue, readDecimal } from 'src/util/normalizers';
import { generateRandomPassword } from 'src/util/password';
import { invalidateUsuarioPermissoesCache } from 'src/auth/permission-lookup';

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
        // Precisa vir junto do login (não só ser checado depois, num guard)
        // pra o frontend já saber, na resposta de `/login`, que precisa
        // forçar a tela de troca de senha — sem isso, só descobriria no
        // primeiro 403 de alguma rota com tag.
        mustChangePassword: true,
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
      // Usuário sem grupo (grupoPermissaoId null) fazia `user.grupo.permissoes`
      // estourar aqui — agora trata como "sem permissão nenhuma" em vez de
      // derrubar o login/consulta inteira.
      user.permissoes = user.grupo?.permissoes || [];
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
          ativo: true,
          grupo: {
            select: {
              nome: true,
              id: true,
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

    const data = await this.formatUsers(usuarios);

    const pagination = buildPagination(page, pageSize, totalItems);

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

        // const permissoesId = usuario?.grupo?.permissoes.map(
        //   ({ permissao }: any) => permissao,
        // );
        usuario.grupoPermissao = usuario.grupo;
        delete usuario.grupo;

        if (usuario?.terapeuta?.fazDevolutiva) {
          usuario.devolutiva = usuario?.terapeuta?.fazDevolutiva;
        }

        if (usuario?.terapeuta?.cargaHoraria) {
          usuario.cargaHoraria = JSON.parse(usuario.terapeuta?.cargaHoraria);
        }

        if (usuario?.terapeuta?.funcoes) {
          usuario.comissao = usuario?.terapeuta?.funcoes.map((funcao: any) => {
            const valor = readDecimal(funcao.comissao);

            const comissao =
              funcao.tipo === 'Fixo'
                ? moneyFormat.format(valor)
                : String(valor);

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
          // grupoId: permissoesId,
          funcoesId: funcoesId,
        };
      }),
    );
  }

  async getUser(login: string) {
    const prisma = getPrismaClient(this.prismaService);

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
      // Usuário sem grupo (grupoPermissaoId null) fazia `user.grupo.permissoes`
      // estourar aqui — agora trata como "sem permissão nenhuma" em vez de
      // derrubar o login/consulta inteira.
      user.permissoes = user.grupo?.permissoes || [];
      delete user.grupo;
    }

    return user;
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    const usuarios: any = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        login: true,
        perfil: true,
        ativo: true,
        grupo: {
          select: {
            nome: true,
            id: true,
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
      where: buildTextSearchWhere(word, ['nome', 'login'], {
        NOT: {
          perfil: {
            nome: {
              in: ['developer', 'Developer'],
            },
          },
        },
      }),
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
          const formatComissao = normalizeCurrencyValue(comissao.valor);

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
            const formatComissao = normalizeCurrencyValue(comissao.valor);

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

  /**
   * `perfilId` chegava sem nenhuma validação — qualquer inteiro era aceito,
   * mesmo que não existisse na tabela `Perfil` (FK só barra na gravação com
   * um erro cru do Prisma). Valida explicitamente aqui para dar uma
   * mensagem clara antes de tentar gravar.
   */
  private async validatePerfilId(perfilId: unknown) {
    const prisma = this.prismaService.getPrismaClient();
    const id = Number(perfilId);

    if (!id || Number.isNaN(id)) {
      throw new Error('Perfil é obrigatório.');
    }

    const perfil = await prisma.perfil.findUnique({ where: { id } });

    if (!perfil) {
      throw new Error('Perfil informado não existe.');
    }

    return { id, nome: perfil.nome };
  }

  /**
   * `perfilId=Developer` dá bypass total de permissão (ver PermissionsGuard/
   * AuthService) — é o caso mais extremo de escalada de privilégio possível
   * nesta rota. Diferente do resto de `perfilId` (que continua livre, pois
   * é acoplado à gestão de Terapeuta), só quem já é Developer pode atribuir
   * o perfil Developer a alguém, criar ou editar.
   */
  private async assertPodeAtribuirPerfil(perfilNome: string, callerLogin?: string) {
    if (perfilNome !== PERFIL.dev) {
      return;
    }

    const caller = callerLogin ? await this.getCallerPerfilNome(callerLogin) : null;

    if (caller !== PERFIL.dev) {
      throw new Error(
        'Somente um usuário com perfil Developer pode atribuir o perfil Developer.',
      );
    }
  }

  private async getCallerPerfilNome(login: string): Promise<string | null> {
    const prisma = this.prismaService.getPrismaClient();

    const caller = await prisma.usuario.findUnique({
      select: { perfil: { select: { nome: true } } },
      where: { login },
    });

    return caller?.perfil?.nome ?? null;
  }

  async create(body: any, callerLogin?: string) {
    const prisma = this.prismaService.getPrismaClient();

    const perfil = await this.validatePerfilId(body.perfilId);
    await this.assertPodeAtribuirPerfil(perfil.nome, callerLogin);

    // Senha fixa e previsível ('12345678') trocada por senha aleatória +
    // troca obrigatória no primeiro login (mustChangePassword) — decisão
    // fechada com o negócio. `grupoPermissaoId` não é mais aceito aqui: o
    // usuário nasce sem grupo/permissão nenhuma, atribuído depois por um
    // ADM via PUT /usuarios/:id/grupo-permissao (rota separada, R4).
    const senhaTemporaria = generateRandomPassword();
    body.senha = bcrypt.hashSync(senhaTemporaria, 8);

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
        perfilId: perfil.id,
        senha: body.senha,
        mustChangePassword: true,
      },
    });

    if (perfil.id === ID_PERFIL_TERAPEUTA.id) {
      await this.createTerapeuta(body, user.id);
    }

    if (!user) return messageError();
    delete (user as any).senha;
    return { ...user, senhaTemporaria };
  }

  async update(body: any, callerLogin?: string) {
    const prisma = this.prismaService.getPrismaClient();

    if (!body.ativo) {
      const desativado = await prisma.usuario.update({
        data: {
          ativo: false,
        },
        where: {
          id: body.id,
        },
      });

      invalidateUsuarioPermissoesCache(desativado.login);

      return desativado;
    }

    const perfil = await this.validatePerfilId(body.perfilId);
    await this.assertPodeAtribuirPerfil(perfil.nome, callerLogin);

    // verifica tem terapeuta criada
    const terapeuta = await prisma.terapeuta.findUnique({
      where: {
        usuarioId: body.id,
      },
    });

    switch (perfil.id) {
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

    // grupoPermissaoId deliberadamente fora deste update (R4): quem tem
    // permissão de editar usuário não altera mais grupo/permissão por essa
    // rota, mesmo enviando o campo no payload — só via PUT
    // /usuarios/:id/grupo-permissao, restrita a quem já administra grupos.
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
        perfilId: perfil.id,
        ativo: body.ativo,
      },
      where: {
        id: body.id,
      },
    });

    invalidateUsuarioPermissoesCache(user.login);

    return user;
  }

  /**
   * Rota separada, só para quem administra grupos de permissão (R4): antes,
   * qualquer pessoa com permissão de editar usuário podia setar
   * `grupoPermissaoId` livremente em POST/PUT /usuarios, inclusive se
   * autopromover. Guard de tag fica no controller; aqui só valida que o
   * grupo existe (ou aceita `null` para remover o usuário de qualquer
   * grupo).
   */
  async updateGrupoPermissao(id: number, grupoPermissaoId: number | null) {
    const prisma = this.prismaService.getPrismaClient();

    if (grupoPermissaoId !== null && grupoPermissaoId !== undefined) {
      const grupo = await prisma.grupoPermissao.findUnique({
        where: { id: Number(grupoPermissaoId) },
      });

      if (!grupo) {
        throw new Error('Grupo de permissão informado não existe.');
      }
    }

    const user = await prisma.usuario.update({
      select: {
        id: true,
        nome: true,
        login: true,
        grupo: { select: { id: true, nome: true } },
      },
      data: {
        grupoPermissaoId: grupoPermissaoId ?? null,
      },
      where: {
        id: Number(id),
      },
    });

    invalidateUsuarioPermissoesCache(user.login);

    return user;
  }

  /**
   * Reset de senha por um terceiro (admin) — antes sempre gravava
   * '12345678' (previsível). Agora gera uma senha aleatória e força a troca
   * no próximo login (`mustChangePassword`); a senha em texto plano só
   * existe nesta resposta, pra quem tem a permissão repassar manualmente —
   * não é logada nem persistida em lugar nenhum além do hash.
   */
  async updatePassword(userId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const senhaTemporaria = generateRandomPassword();
    const senha = bcrypt.hashSync(senhaTemporaria, 8);

    const user = await prisma.usuario.update({
      select: { id: true, nome: true, login: true },
      data: {
        senha,
        mustChangePassword: true,
      },
      where: {
        id: Number(userId),
      },
    });

    invalidateUsuarioPermissoesCache(user.login);

    return { ...user, senhaTemporaria };
  }

  async updatePasswordLogin(login: string, data: any) {
    const prisma = this.prismaService.getPrismaClient();

    const senha = bcrypt.hashSync(data.senha.toString(), 8);

    await prisma.usuario.update({
      data: {
        senha: senha,
        // Troca voluntária ou forçada (pós-reset) sempre libera o usuário
        // das restrições de mustChangePassword.
        mustChangePassword: false,
      },
      where: {
        login,
      },
    });

    invalidateUsuarioPermissoesCache(login);

    return {};
  }
}
