import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgramaProps } from './programa.interface';

@Injectable()
export class ProgramaService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number, query?: any) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [result, totalItems] = await Promise.all([
      prisma.programa.findMany({
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
        where: {
          ativo: true,
        },
        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.programa.count(),
    ]);

    const totalPages = Math.ceil(result.length / pageSize);
    const data = [];

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data: data, pagination };
  }

  async update(data: any) {
    const prisma = this.prismaService.getPrismaClient();

    const nome = data.nome;
    const id = data.id;

    delete data.nome;
    delete data.id;

    try {
      return await prisma.programa.update({
        data: {
          nome,
          ativo: true,
        },
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async create(data: any) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      return await prisma.programa.create({
        data: data,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.programa.findMany({
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
          // {
          //   atividades: {
          //     contains: word,
          //   },
          // },
        ],
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.programa.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.programa.findMany({
      select: {
        id: true,
        nome: true,
      },
    });
  }
}
