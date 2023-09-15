import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StatusEventosProps } from './status-evento.interface';

@Injectable()
export class StatusEventoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      this.prismaService.statusEventos.findMany({
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
      this.prismaService.statusEventos.count(),
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
    return this.prismaService.statusEventos.findMany({
      select: {
        id: true,
        nome: true,
        cobrar: true,
        ativo: true,
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
    return await this.prismaService.statusEventos.findMany({
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
    return await this.prismaService.statusEventos.create({
      data: body,
    });
  }

  async update(body: StatusEventosProps) {
    return await this.prismaService.statusEventos.update({
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
    return await this.prismaService.statusEventos.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getStatusUnique(id: number) {
    return await this.prismaService.statusEventos.findUniqueOrThrow({
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
