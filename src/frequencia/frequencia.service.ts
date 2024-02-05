import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FrequenciaService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

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
    const prisma = this.prismaService.getPrismaClient();

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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.frequencia.findMany({
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
        ],
      },
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.frequencia.create({
      data: body,
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.frequencia.update({
      data: {
        nome: body.nome,
        ativo: body.ativo,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.frequencia.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
