import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';

@Injectable()
export class TipoSessaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      this.prismaService.tipoSessao.findMany({
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
      this.prismaService.tipoSessao.count(),
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
    return this.prismaService.tipoSessao.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        NOT: {
          nome: 'Terapia',
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    return await this.prismaService.tipoSessao.findMany({
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

  async create(body: any) {
    return await this.prismaService.tipoSessao.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.tipoSessao.update({
      data: {
        nome: body.casa,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.tipoSessao.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getTipoSessaoUnique(id: number) {
    return await this.prismaService.tipoSessao.findUniqueOrThrow({
      select: {
        nome: true,
        id: true,
      },
      where: {
        id: Number(id),
      },
    });
  }
}
