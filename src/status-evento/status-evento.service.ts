import { Injectable, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StatusEventosProps } from './status-evento.interface';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StatusEventoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.statusEventos.findMany({
        select: {
          id: true,
          nome: true,
          cobrar: true,
          ativo: true,
        },
        orderBy: {
          nome: 'asc',
        },
        where: {
          ativo: true,
        },
        skip,
        take: pageSize,
      }),
      prisma.statusEventos.count(),
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

    return prisma.statusEventos.findMany({
      select: {
        id: true,
        nome: true,
        cobrar: true,
      },
      where: {
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.findMany({
      select: {
        id: true,
        nome: true,
        cobrar: true,
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        ativo: true,
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

  async create(body: StatusEventosProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.create({
      data: body,
    });
  }

  async update(body: StatusEventosProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.update({
      data: {
        nome: body.nome,
        ativo: body.ativo,
        cobrar: body.cobrar,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getStatusUnique(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.findUniqueOrThrow({
      select: {
        nome: true,
        id: true,
        cobrar: true,
      },
      where: {
        id: Number(id),
      },
    });
  }
}
