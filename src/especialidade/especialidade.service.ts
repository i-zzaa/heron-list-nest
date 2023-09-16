import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class EspecialidadeService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    return this.prismaService.especialidade.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async getespecialidadeName(nome: string) {
    return await this.prismaService.especialidade.findFirstOrThrow({
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
    return await this.prismaService.especialidade.findMany({
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
    return await this.prismaService.especialidade.create({
      data: body,
    });
  }

  async update(body: any) {
    return await this.prismaService.especialidade.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(body.id),
      },
    });
  }

  async delete(id: number) {
    return await this.prismaService.especialidade.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
