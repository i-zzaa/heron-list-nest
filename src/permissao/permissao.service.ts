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
    const prisma = this.prismaService.getPrismaClient();

    const { id, grupoPermissaoId } = await this.userService.getUser(login);
    const permissoes = await prisma.grupoPermissaoOnPermissao.findMany({
      select: {
        permissao: {
          select: {
            cod: true,
            descricao: true,
          },
        },
      },
      where: {
        grupoPermissaoId: grupoPermissaoId,
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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.permissao.findMany({
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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.permissao.findMany({
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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.permissao.create({
      data: body,
    });
  }

  async update(body: PermissaoProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.permissao.update({
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
