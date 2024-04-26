import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PeriodoProps } from './periodo.interface';

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
    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        OR: [
          {
            nome: {
              contains: word,
            },
          },
        ],
      },
    });
  }

  async create(body: PeriodoProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.create({
      data: body,
    });
  }

  async update(body: PeriodoProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.periodo.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
