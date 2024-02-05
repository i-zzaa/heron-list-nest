import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StatusProps } from './status.interface';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';

@Injectable()
export class StatusService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.status.findMany({
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
      prisma.status.count(),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data, pagination };
  }

  async dropdown(statusPacienteCod: string) {
    const prisma = this.prismaService.getPrismaClient();

    return prisma.status.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        NOT: {
          nome:
            statusPacienteCod === STATUS_PACIENT_COD.queue_avaliation
              ? 'Voltou ABA'
              : '',
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.status.findMany({
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

  async create(body: StatusProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.status.create({
      data: body,
    });
  }

  async update(body: StatusProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.status.update({
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

    return await prisma.status.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getstatusUnique(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.status.findUniqueOrThrow({
      select: {
        id: true,
        nome: true,
      },
      where: {
        id: Number(id),
      },
    });
  }
}
