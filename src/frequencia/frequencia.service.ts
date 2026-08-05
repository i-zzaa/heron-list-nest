import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildCreatePayload, getPrismaClient } from 'src/util/crud';
import { toNumberId } from 'src/util/normalizers';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class FrequenciaService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.frequencia.findMany({
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

  async getFrequenciaName(nome: string) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.frequencia.findFirstOrThrow({
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

    return await prisma.frequencia.findMany({
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

  async create(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.frequencia.create({
      data: buildCreatePayload(body, ['nome', 'ativo']),
    });
  }

  async update(body: any) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.frequencia.update({
      data: buildCreatePayload(body, ['nome', 'ativo']),
      where: {
        id: toNumberId(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = getPrismaClient(this.prismaService);

    return await prisma.frequencia.delete({
      where: {
        id: toNumberId(id),
      },
    });
  }
}
