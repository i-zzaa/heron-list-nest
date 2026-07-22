import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ModalidadeProps } from './modalidade.interface';
import { buildPagination } from 'src/util/pagination';
import { getModalidadeIdsByStatusPaciente } from 'src/util/filters';
import { toNumberId } from 'src/util/normalizers';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { buildTextSearchWhere } from 'src/util/search';

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
    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown(statusPacienteCod: string) {
    const prisma = this.prismaService.getPrismaClient();

    const ids = getModalidadeIdsByStatusPaciente(statusPacienteCod);

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
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.modalidade.findMany({
      select: {
        id: true,
        nome: true,
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: buildTextSearchWhere(word, ['nome'], {
        ativo: true,
      }),
    });
  }

  async create(body: ModalidadeProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.create({
      data: buildCreatePayload(body, ['nome', 'ativo']),
    });
  }

  async update(body: ModalidadeProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.update({
      data: buildCreatePayload(body, ['nome', 'ativo']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.modalidade.delete({
      where: {
        id: toNumberId(id),
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
