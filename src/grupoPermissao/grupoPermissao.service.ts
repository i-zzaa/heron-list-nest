import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { GrupoPermissaoProps } from './grupoPermissao.interface';

@Injectable()
export class GrupoPermissaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.grupoPermissao.findMany({
        select: {
          nome: true,
          permissoes: {
            select: {
              permissao: true,
            },
          },
        },
        skip,
        take: pageSize,
      }),
      prisma.grupoPermissao.count(),
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

    return await prisma.grupoPermissao.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.permissao.findMany({
      select: {
        cod: true,
        descricao: true,
      },
      orderBy: {
        cod: 'asc',
      },
      where: {
        OR: [
          {
            cod: {
              contains: word,
            },
          },
          {
            descricao: {
              contains: word,
            },
          },
        ],
      },
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    const grupo = await prisma.grupoPermissao.create({
      data: {
        nome: body.nome,
      },
    });

    await Promise.all(
      body.permissoesId.map(async (permissaoId) => {
        await prisma.grupoPermissaoOnPermissao.create({
          data: {
            grupoPermissaoId: grupo.id,
            permissaoId: permissaoId,
          },
        });
      }),
    );

    return grupo;
  }

  async update(body: GrupoPermissaoProps) {
    const prisma = this.prismaService.getPrismaClient();

    const grupo = await prisma.grupoPermissao.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: body.id,
      },
    });

    await prisma.grupoPermissaoOnPermissao.deleteMany({
      where: {
        grupoPermissaoId: body.id,
      },
    });

    await Promise.all(
      body.permissoesId.map(async (permissaoId) => {
        await prisma.grupoPermissaoOnPermissao.create({
          data: {
            grupoPermissaoId: grupo.id,
            permissaoId: permissaoId,
          },
        });
      }),
    );

    return grupo;
  }
}
