import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PeriodoProps } from './periodo.interface';

@Injectable()
export class PeriodoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      this.prismaService.periodo.findMany({
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
      this.prismaService.periodo.count(),
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
    return this.prismaService.periodo.findMany({
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
    return await this.prismaService.periodo.findMany({
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
    return await this.prismaService.periodo.create({
      data: body,
    });
  }

  async update(body: PeriodoProps) {
    return await this.prismaService.periodo.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.periodo.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
