import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildPagination } from 'src/util/pagination';
import { toNumberId } from 'src/util/normalizers';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class LocalidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.localidade.findMany({
        select: {
          id: true,
          casa: true,
          sala: true,
          ativo: true,
        },
        orderBy: {
          casa: 'asc',
        },
        where: {
          ativo: true,
        },
        skip,
        take: pageSize,
      }),
      prisma.localidade.count(),
    ]);
    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

    const localidade = await prisma.localidade.findMany({
      select: {
        id: true,
        casa: true,
        sala: true,
        ativo: true,
      },
      orderBy: {
        casa: 'asc',
      },
      where: {
        ativo: true,
      },
    });

    return await Promise.all(
      localidade.map((item: any) => {
        return {
          id: item.id,
          nome: this.formatLocalidade(item),
        };
      }),
    );
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.localidade.findMany({
      select: {
        id: true,
        casa: true,
        sala: true,
        ativo: true,
      },
      orderBy: {
        casa: 'asc',
      },
      where: buildTextSearchWhere(word, ['casa', 'sala'], {
        ativo: true,
      }),
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.create({
      data: buildCreatePayload(body, ['casa', 'sala', 'ativo']),
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.update({
      data: buildCreatePayload(body, ['casa', 'sala', 'ativo']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.delete({
      where: {
        id: toNumberId(id),
      },
    });
  }

  formatLocalidade = (item: any) => {
    return `${item.casa} - ${item.sala}`;
  };
}
