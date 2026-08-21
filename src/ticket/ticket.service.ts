import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';
import { assertEntidadeNaoEstaEmUso } from 'src/util/assert-not-in-use';

// Cadastro simples (id + nome), mesmo molde de Periodo/Status/TipoSessao —
// GET /ticket/:search (busca por texto, usada pelo campo de busca da
// listagem), GET /ticket/dropdown (select do filtro de Baixa) e CRUD
// paginado, ver TicketController.
@Injectable()
export class TicketService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = getPrismaClient(this.prismaService);

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.ticket.findMany({
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
      prisma.ticket.count({ where: { ativo: true } }),
    ]);

    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.ticket.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        ativo: true,
      },
    });
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.ticket.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: buildTextSearchWhere(word, ['nome'], {
        ativo: true,
      }),
    });
  }

  async create(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.ticket.create({
      data: buildCreatePayload(body, ['nome', 'ativo']),
    });
  }

  async update(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.ticket.update({
      data: buildCreatePayload(body, ['nome', 'ativo']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = getPrismaClient(this.prismaService);
    const ticketId = toNumberId(id);

    await assertEntidadeNaoEstaEmUso(
      prisma,
      [{ model: 'baixa', where: { ticketId } }],
      'Não é possível excluir: ticket em uso em ao menos uma baixa.',
    );

    return prisma.ticket.delete({
      where: {
        id: ticketId,
      },
    });
  }
}
