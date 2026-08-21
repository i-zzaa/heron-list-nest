import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { STATUS_PACIENT_COD } from 'src/status-paciente/status-paciente.interface';
import { buildPagination } from 'src/util/pagination';
import { toNumberId } from 'src/util/normalizers';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class TipoSessaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.tipoSessao.findMany({
        select: {
          id: true,
          nome: true,
          padrao: true,
        },
        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.tipoSessao.count(),
    ]);
    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

    return prisma.tipoSessao.findMany({
      select: {
        id: true,
        nome: true,
        padrao: true,
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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.tipoSessao.findMany({
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

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.tipoSessao.create({
      data: buildCreatePayload(body, ['nome', 'padrao']),
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.tipoSessao.update({
      data: buildCreatePayload(body, ['nome', 'padrao']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.tipoSessao.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getTipoSessaoUnique(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.tipoSessao.findUniqueOrThrow({
      select: {
        nome: true,
        id: true,
        padrao: true,
      },
      where: {
        id: Number(id),
      },
    });
  }
}
