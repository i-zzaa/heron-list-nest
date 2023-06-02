import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CatalogoServiceInterface } from './catalogo.interface';

@Injectable()
export class CatalogoService implements CatalogoServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async get() {
    return await this.prismaService.catalogo.findMany({
      orderBy: {
        title: 'asc',
      },
    });
  }
  async search(word: string) {
    return await this.prismaService.catalogo.findMany({
      orderBy: {
        title: 'asc',
      },
      where: {
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
