import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
    const totalPages = Math.ceil(totalItems / pageSize); // Calcula o total de páginas

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

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
    const prisma = this.prismaService.getPrismaClient();

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
      where: {
        ativo: true,
        OR: [
          {
            casa: {
              contains: word,
            },
          },
          {
            sala: {
              contains: word,
            },
          },
        ],
      },
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.create({
      data: body,
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.update({
      data: {
        casa: body.casa,
        sala: body.sala,
        ativo: body.ativo,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.localidade.delete({
      where: {
        id: Number(id),
      },
    });
  }

  formatLocalidade = (item: any) => {
    return `${item.casa} - ${item.sala}`;
  };
}
