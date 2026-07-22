import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GrupoPermissaoProps } from './grupoPermissao.interface';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class GrupoPermissaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const [data, totalItems]: any = await Promise.all([
      prisma.grupoPermissao.findMany({
        select: {
          id: true,
          nome: true,
          permissoes: {
            select: {
              permissao: true,
            },
          },
        },
        where: {
          NOT: {
            nome: {
              in: ['developer', 'Developer'],
            },
          },
        },
        skip,
        take: pageSize,
      }),

      prisma.grupoPermissao.count(),
    ]);

    await Promise.all(
      data.map(async (item: any) => {
        item.permissoesId = [];
        await Promise.all(
          item?.permissoes.map(({ permissao }: any) => {
            item.permissoesId.push(permissao.id);
          }),
        );
        delete item.permissoes;
      }),
    );

    const pagination = buildPagination(page, pageSize, totalItems);

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
      where: {
        NOT: {
          nome: {
            in: ['developer', 'Developer'],
          },
        },
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
      where: buildTextSearchWhere(word, ['cod', 'descricao']),
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    const grupo = await prisma.grupoPermissao.create({
      data: {
        nome: body.nome.toUpperCase(),
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

    if (body.permissoesId) {
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
    }

    return grupo;
  }
}
