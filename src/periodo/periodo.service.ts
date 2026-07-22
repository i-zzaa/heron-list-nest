import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PeriodoProps } from './periodo.interface';
import { buildPagination } from 'src/util/pagination';
import { toNumberId } from 'src/util/normalizers';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class PeriodoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.periodo.findMany({
        select: {
          id: true,
          nome: true,
        },
        orderBy: {
          nome: 'asc',
        },
        where: {},
        skip,
        take: pageSize,
      }),
      prisma.periodo.count(),
    ]);
    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

    return prisma.periodo.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {},
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.periodo.findMany({
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

  async create(body: PeriodoProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.create({
      data: buildCreatePayload(body, ['nome']),
    });
  }

  async update(body: PeriodoProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.update({
      data: buildCreatePayload(body, ['nome']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.delete({
      where: {
        id: toNumberId(id),
      },
    });
  }
}
