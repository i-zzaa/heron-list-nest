import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusProps } from './status.interface';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';
import { buildPagination } from 'src/util/pagination';
import { toNumberId } from 'src/util/normalizers';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { buildTextSearchWhere } from 'src/util/search';

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
          padrao: true,
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
    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown(statusPacienteCod: string) {
    const prisma = this.prismaService.getPrismaClient();

    return prisma.status.findMany({
      select: {
        id: true,
        nome: true,
        padrao: true,
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
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.status.findMany({
      select: {
        id: true,
        nome: true,
        padrao: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: buildTextSearchWhere(word, ['nome']),
    });
  }

  async create(body: StatusProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.status.create({
      data: buildCreatePayload(body, ['nome', 'padrao']),
    });
  }

  async update(body: StatusProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.status.update({
      data: buildCreatePayload(body, ['nome', 'padrao']),
      where: {
        id: toNumberId(body.id),
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
        padrao: true,
      },
      where: {
        id: Number(id),
      },
    });
  }
}
