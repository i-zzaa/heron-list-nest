import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ModalidadeProps } from './modalidade.interface';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';

@Injectable()
export class ModalidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.modalidade.findMany({
        select: {
          id: true,
          nome: true,
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
      prisma.modalidade.count(),
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

    let ids = [];
    switch (statusPacienteCod) {
      case STATUS_PACIENT_COD.queue_avaliation:
        ids = [1];
        break;
      case STATUS_PACIENT_COD.queue_devolutiva:
        ids = [2];
        break;
      case STATUS_PACIENT_COD.queue_therapy:
      case STATUS_PACIENT_COD.devolutiva:
        ids = [3];
        break;
      default:
        ids = [1, 2, 3];
        break;
    }

    return await prisma.modalidade.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        id: {
          in: ids,
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.findMany({
      select: {
        id: true,
        nome: true,
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

  async create(body: ModalidadeProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.create({
      data: body,
    });
  }

  async update(body: ModalidadeProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.update({
      data: {
        nome: body.nome,
        ativo: body.ativo,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getmodalidadeUnique(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.findUniqueOrThrow({
      select: {
        id: true,
        nome: true,
        ativo: true,
      },
      where: {
        id: Number(id),
      },
    });
  }
}
