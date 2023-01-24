import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import {
  PermissaoProps,
  PermissaoServiceInterface,
} from './permissao.interface';

@Injectable()
export class PermissaoService implements PermissaoServiceInterface {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createPermissao(body: PermissaoProps): Promise<PermissaoProps> {
    return await this.prismaService.permissao.create({
      data: body,
    });
  }
  async updatePermissao(body: PermissaoProps, id: number) {
    return await this.prismaService.permissao.update({
      data: {
        cod: body.cod,
        descricao: body.descricao,
      },
      where: {
        id: Number(id),
      },
    });
  }
  async getPermissaoUser(login: string) {
    const { id } = await this.userService.getUser(login);

    const permissoes = await this.prismaService.usuarioOnPermissao.findMany({
      select: {
        permissao: {
          select: {
            cod: true,
            descricao: true,
          },
        },
      },
      where: {
        usuarioId: id,
      },
      orderBy: {
        permissao: {
          cod: 'asc',
        },
      },
    });

    return permissoes?.map(({ permissao }: any) => permissao.cod);
  }
  async searchPermissao(word: string) {
    return await this.prismaService.permissao.findMany({
      select: {
        cod: true,
        descricao: true,
      },
      orderBy: {
        cod: 'asc',
      },
      where: {
        OR: [
          {
            cod: {
              contains: word,
            },
          },
          {
            descricao: {
              contains: word,
            },
          },
        ],
      },
    });
  }
}
