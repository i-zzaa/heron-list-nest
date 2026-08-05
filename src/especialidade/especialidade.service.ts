import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class EspecialidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = getPrismaClient(this.prismaService);

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.especialidade.findMany({
        select: {
          id: true,
          nome: true,
          cor: true,
        },
        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.especialidade.count(),
    ]);

    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.especialidade.findMany({
      select: {
        id: true,
        nome: true,
        // cor: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async getespecialidadeName(nome: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.findFirstOrThrow({
      select: {
        id: true,
        nome: true,
      },
      where: {
        nome: nome,
      },
    });
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: buildTextSearchWhere(word, ['nome']),
    });
  }

  async create(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.create({
      data: buildCreatePayload(body, ['nome']),
    });
  }

  async update(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.update({
      data: buildCreatePayload(body, ['nome']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.delete({
      where: {
        id: toNumberId(id),
      },
    });
  }
}
