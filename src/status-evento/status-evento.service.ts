import { Injectable, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEventosProps } from './status-evento.interface';
import { AuthGuard } from '@nestjs/passport';
import { buildPagination } from 'src/util/pagination';
import { toNumberId } from 'src/util/normalizers';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { buildTextSearchWhere } from 'src/util/search';

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
    const pagination = buildPagination(page, pageSize, totalItems);

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
    const prisma = getPrismaClient(this.prismaService);

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
      where: buildTextSearchWhere(word, ['nome'], {
        ativo: true,
      }),
    });
  }

  async create(body: StatusEventosProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.create({
      data: buildCreatePayload(body, ['nome', 'ativo', 'cobrar']),
    });
  }

  async update(body: StatusEventosProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.statusEventos.update({
      data: buildCreatePayload(body, ['nome', 'ativo', 'cobrar']),
      where: {
        id: toNumberId(body.id),
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
