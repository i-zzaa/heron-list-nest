import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ServiceServiceInterface } from './service.interface';

@Injectable()
export class ServiceService implements ServiceServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async get(catalogId: number) {
    return await this.prismaService.service.findMany({
      orderBy: {
        title: 'asc',
      },
      where: {
        catalogId,
      },
    });
  }
  async search(word: string, catalogId: number) {
    return await this.prismaService.service.findMany({
      orderBy: {
        title: 'asc',
      },
      where: {
        catalogId,
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
