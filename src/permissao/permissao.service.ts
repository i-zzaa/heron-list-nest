import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { PermissaoProps } from './permissao.interface';

@Injectable()
export class PermissaoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

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

    return Promise.all(permissoes.map(({ permissao }: any) => permissao.cod));
  }

  async getAll() {
    return await this.prismaService.permissao.findMany({
      select: {
        id: true,
        cod: true,
        descricao: true,
      },
      orderBy: {
        cod: 'asc',
      },
    });
  }

  async search(word: string) {
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

  async create(body: any) {
    return await this.prismaService.permissao.create({
      data: body,
    });
  }

  async update(body: PermissaoProps) {
    return await this.prismaService.permissao.update({
      data: {
        cod: body.cod,
        descricao: body.descricao,
      },
      where: {
        id: Number(body.id),
      },
    });
  }
}
