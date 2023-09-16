import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FrequenciaService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    return this.prismaService.frequencia.findMany({
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
    return await this.prismaService.frequencia.findFirstOrThrow({
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
    return await this.prismaService.frequencia.findMany({
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
    return await this.prismaService.frequencia.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.frequencia.update({
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
    return await this.prismaService.frequencia.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
