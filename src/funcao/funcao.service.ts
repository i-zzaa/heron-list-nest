import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FuncaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.funcao.findMany({
        select: {
          id: true,
          nome: true,
          especialidade: {
            select: {
              id: true,
              nome: true,
            },
          },
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

    return prisma.funcao.findMany({
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

  async getTerapeutaByFuncaoDropdown(terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const funcoes = await prisma.terapeutaOnFuncao.findMany({
      select: {
        funcao: true,
      },
      where: {
        terapeutaId: terapeutaId,
      },
      orderBy: {
        funcao: {
          nome: 'asc',
        },
      },
    });

    return await Promise.all(
      funcoes.map(({ funcao }: any) => {
        return {
          id: funcao.id,
          nome: funcao.nome,
        };
      }),
    );
  }
  async getFuncaoByEspecialidadeDropdown(especialidade: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.funcao.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        especialidade: {
          nome: especialidade,
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.funcao.findMany({
      select: {
        id: true,
        nome: true,
        especialidade: true,
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
          {
            especialidade: {
              nome: {
                contains: word,
              },
            },
          },
        ],
      },
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.funcao.create({
      data: body,
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.funcao.update({
      data: {
        nome: body.nome,
        especialidadeId: body.especialidadeId,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.funcao.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
