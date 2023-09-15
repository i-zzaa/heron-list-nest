import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PerfilService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    return this.prismaService.perfil.findMany({
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
    return await this.prismaService.perfil.findMany({
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
    return await this.prismaService.perfil.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.perfil.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.perfil.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
