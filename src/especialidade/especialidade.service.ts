import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EspecialidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

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
    const prisma = this.prismaService.getPrismaClient();

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
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.especialidade.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
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

    return await prisma.especialidade.create({
      data: body,
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.especialidade.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.especialidade.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
