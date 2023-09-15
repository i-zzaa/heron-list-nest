import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FuncaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    return this.prismaService.funcao.findMany({
      select: {
        id: true,
        nome: true,
        especialidade: true,
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        ativo: true,
      },
    });
  }

  async search(word: string) {
    return await this.prismaService.funcao.findMany({
      select: {
        id: true,
        nome: true,
        especialidade: true,
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
          {
            especialidade: {
              nome: {
                contains: word,
              },
            },
          },
        ],
      },
    });
  }

  async create(body: any) {
    return await this.prismaService.funcao.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.funcao.update({
      data: {
        nome: body.nome,
        especialidadeId: body.especialidadeId,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.funcao.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
