import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class PerfilService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.perfil.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        NOT: {
          nome: 'Developer',
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.perfil.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: buildTextSearchWhere(word, ['nome'], {
        NOT: {
          nome: 'Developer',
        },
      }),
    });
  }

  async create(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.perfil.create({
      data: buildCreatePayload(body, ['nome']),
    });
  }

  async update(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.perfil.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.perfil.delete({
      where: {
        id: toNumberId(id),
      },
    });
  }
}
