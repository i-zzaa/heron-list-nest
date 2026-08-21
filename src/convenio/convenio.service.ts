import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class ConvenioService {
  constructor(private readonly prismaService: PrismaService) {}

  // Faltava a listagem paginada (só existia dropdown/search) — o front
  // chama GET /convenio?page=&pageSize= e caía em 404, igual já tinha
  // acontecido com Especialidade.
  async getAll(page: number, pageSize: number) {
    const prisma = getPrismaClient(this.prismaService);

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.convenio.findMany({
        select: {
          id: true,
          nome: true,
        },
        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.convenio.count(),
    ]);

    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.convenio.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.convenio.findMany({
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

    return await prisma.convenio.create({
      data: buildCreatePayload(body, ['nome']),
    });
  }

  async update(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.convenio.update({
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

    return await prisma.convenio.delete({
      where: {
        id: toNumberId(id),
      },
    });
  }
}
