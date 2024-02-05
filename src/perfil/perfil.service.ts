import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PerfilService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();

    return prisma.perfil.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        NOT: {
          nome: 'Developer',
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async search(word: string) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.perfil.findMany({
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
        NOT: {
          nome: 'Developer',
        },
      },
    });
  }

  async create(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.perfil.create({
      data: body,
    });
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.perfil.update({
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

    return await prisma.perfil.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
