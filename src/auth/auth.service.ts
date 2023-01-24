import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserProps } from 'src/user/user.interface';
import {
  ERROR_LOGIN_PASSWORD,
  ERROR_NOT_ACTIVE,
  ERROR_NOT_FOUND_USER,
} from 'src/utils/message.response';
import {
  AuthProps,
  AuthResponse,
  AuthServiceInterface,
} from './auth.interface';
import createError from 'http-errors';
import * as bcrypt from 'bcrypt';
import { signAccessToken } from 'src/utils/jwt';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async loginService(params: AuthProps): Promise<AuthResponse> {
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
        login: params.login,
      },
    });

    if (!user) throw createError(404, ERROR_NOT_FOUND_USER);

    const checkPassword = bcrypt.compareSync(params.senha, user?.senha || '');
    if (!checkPassword) throw createError(404, ERROR_LOGIN_PASSWORD);

    if (!user.ativo) throw createError(401, ERROR_NOT_ACTIVE);

    const accessToken: Promise<string> | unknown = await signAccessToken(
      params,
    );

    delete user.senha;

    const permissoesList: string[] = [];
    user.permissoes?.map(({ permissao }: any) => {
      permissoesList.push(permissao.cod);
    });

    user.permissoes = permissoesList;

    return {
      accessToken,
      user,
    };
  }
}
