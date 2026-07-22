import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { PermissaoProps } from './permissao.interface';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class PermissaoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async getPermissaoUser(login: string) {
    const prisma = getPrismaClient(this.prismaService);

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
    const prisma = getPrismaClient(this.prismaService);

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
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.permissao.findMany({
      select: {
        cod: true,
        descricao: true,
      },
      orderBy: {
        cod: 'asc',
      },
      where: buildTextSearchWhere(word, ['cod', 'descricao']),
    });
  }

  async create(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.permissao.create({
      data: buildCreatePayload(body, ['cod', 'descricao']),
    });
  }

  async update(body: PermissaoProps) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.permissao.update({
      data: buildCreatePayload(body, ['cod', 'descricao']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }
}
