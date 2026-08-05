import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { ProgramaProps } from './programa.interface';
import { buildTextSearchWhere } from 'src/util/search';
import { buildPagination } from 'src/util/pagination';

@Injectable()
export class ProgramaService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number, query?: any) {
    const prisma = getPrismaClient(this.prismaService);

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

    const data = result;
    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async update(data: any) {
    const prisma = getPrismaClient(this.prismaService);

    const nome = data.nome;
    const id = data.id;

    delete data.nome;
    delete data.id;

    try {
      return await prisma.programa.update({
        data: buildCreatePayload({ nome, ativo: true }, ['nome', 'ativo']),
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async create(data: any) {
    const prisma = getPrismaClient(this.prismaService);

    try {
      return await prisma.programa.create({
        data: buildCreatePayload(data, ['nome', 'ativo']),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.programa.findMany({
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

  async delete(id: number) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.programa.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async dropdown(tipoProtocolo: number) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.programa.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        tipoProtocolo: {
          array_contains: tipoProtocolo, //Feito assim para filtrar apenas quando for portage
        },
      },
    });
  }
}
