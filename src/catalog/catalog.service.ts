import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CatalogServiceInterface } from './catalog.interface';

@Injectable()
export class CatalogService implements CatalogServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async get() {
    return await this.prismaService.catalog.findMany({
      orderBy: {
        title: 'asc',
      },
    });
  }
  async search(word: string) {
    return await this.prismaService.catalog.findMany({
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
