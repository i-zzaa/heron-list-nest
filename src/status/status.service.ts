import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StatusProps } from './status.interface';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';

@Injectable()
export class StatusService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      this.prismaService.status.findMany({
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
      this.prismaService.status.count(),
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
    return this.prismaService.status.findMany({
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
    return await this.prismaService.status.findMany({
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
    return await this.prismaService.status.create({
      data: body,
    });
  }

  async update(body: StatusProps) {
    return await this.prismaService.status.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.status.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getstatusUnique(id: number) {
    return await this.prismaService.status.findUniqueOrThrow({
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
