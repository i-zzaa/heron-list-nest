import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ModalidadeProps } from './modalidade.interface';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';

@Injectable()
export class ModalidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      this.prismaService.modalidade.findMany({
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
      this.prismaService.modalidade.count(),
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

    return await this.prismaService.modalidade.findMany({
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
    return await this.prismaService.modalidade.findMany({
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
    return await this.prismaService.modalidade.create({
      data: body,
    });
  }

  async update(body: ModalidadeProps) {
    return await this.prismaService.modalidade.update({
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
    return await this.prismaService.modalidade.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getmodalidadeUnique(id: number) {
    return await this.prismaService.modalidade.findUniqueOrThrow({
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
