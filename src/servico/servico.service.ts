import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ServicoServiceInterface } from './servico.interface';

@Injectable()
export class ServicoService implements ServicoServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async get(catalogoId: number) {
    return await this.prismaService.servico.findMany({
      orderBy: {
        title: 'asc',
      },
      where: {
        catalogoId,
      },
    });
  }
  async search(word: string, catalogoId: number) {
    return await this.prismaService.servico.findMany({
      orderBy: {
        title: 'asc',
      },
      where: {
        catalogoId,
        OR: [
          {
            title: {
              contains: word,
            },
          },
        ],
      },
    });
  }
}
