import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';
import { assertEntidadeNaoEstaEmUso } from 'src/util/assert-not-in-use';

@Injectable()
export class EspecialidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number) {
    const prisma = getPrismaClient(this.prismaService);

    const skip = (page - 1) * pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.especialidade.findMany({
        select: {
          id: true,
          nome: true,
          cor: true,
        },
        orderBy: {
          nome: 'asc',
        },
        skip,
        take: pageSize,
      }),
      prisma.especialidade.count(),
    ]);

    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async dropdown() {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.especialidade.findMany({
      select: {
        id: true,
        nome: true,
        // cor: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async getespecialidadeName(nome: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.findFirstOrThrow({
      select: {
        id: true,
        nome: true,
      },
      where: {
        nome: nome,
      },
    });
  }

  async search(word: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: buildTextSearchWhere(word, ['nome']),
    });
  }

  async create(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.create({
      data: buildCreatePayload(body, ['nome']),
    });
  }

  async update(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.especialidade.update({
      data: buildCreatePayload(body, ['nome']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = getPrismaClient(this.prismaService);
    const especialidadeId = toNumberId(id);

    // R20: antes era hard delete direto — se a especialidade estivesse em
    // uso, o Prisma rejeitava com erro cru de FK (500 genérico). Agora
    // checa antes e devolve mensagem clara.
    await assertEntidadeNaoEstaEmUso(
      prisma,
      [
        { model: 'calendario', where: { especialidadeId } },
        { model: 'terapeuta', where: { especialidadeId } },
        { model: 'vagaOnEspecialidade', where: { especialidadeId } },
        { model: 'funcao', where: { especialidadeId } },
      ],
      'Não é possível excluir: especialidade em uso (evento, terapeuta, vaga ou função vinculados).',
    );

    return await prisma.especialidade.delete({
      where: {
        id: especialidadeId,
      },
    });
  }
}
