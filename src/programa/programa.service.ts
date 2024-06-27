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
          atividades: true,
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

    result.map((item: any) => {
      data.push({
        ...item,
        atividades: JSON.parse(item.atividades),
      });
    });

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
    const atividades = [];

    Object.keys(data).map((key) => {
      const idAtividade = key.match(/\d+/g)[0];

      atividades.push({
        id: idAtividade,
        nome: data[key],
      });
    });

    try {
      return await prisma.programa.update({
        data: {
          nome,
          atividades: JSON.stringify(atividades),
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

    const nome = data.nome;
    delete data.nome;
    const atividades = [];

    Object.keys(data).map((key) => {
      const id = key.match(/\d+/g)[0];

      atividades.push({
        id: id,
        nome: data[key],
      });
    });

    try {
      return await prisma.programa.create({
        data: {
          nome,
          atividades: JSON.stringify(atividades),
          ativo: true,
        },
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
        atividades: true,
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
    return [
      { id: 1, nome: 'Mando' },
      { id: 2, nome: 'Tato' },
      { id: 3, nome: 'Ouvinte/VP' },
      { id: 4, nome: 'MTS' },
      { id: 5, nome: 'Brincar' },
      { id: 6, nome: 'Social' },
      { id: 7, nome: 'Imitação' },
      { id: 8, nome: 'Ecóico' },
      { id: 9, nome: 'LRFFC' },
      { id: 10, nome: 'INTRAV' },
      { id: 11, nome: 'Grupo' },
      { id: 12, nome: 'Ling' },
    ];
  }
}
