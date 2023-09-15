import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ConvenioService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    return this.prismaService.convenio.findMany({
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
    return await this.prismaService.convenio.findMany({
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
    return await this.prismaService.convenio.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.convenio.update({
      data: {
        nome: body.nome,
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
