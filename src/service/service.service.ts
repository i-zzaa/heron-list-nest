import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ServiceProps, ServiceServiceInterface } from './service.interface';

@Injectable()
export class ServiceService implements ServiceServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}
  async getAll() {
    return await this.prismaService.service.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async get(cod: string) {
    const response: ServiceProps[] = await this.prismaService.service.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
      where: {
        name: {
          contains: cod,
        },
      },
    });

    return await Promise.all(
      response.map((catalog: ServiceProps) => {
        const split = catalog.name.split('::');

        return {
          cod: `${split[0]}::${split[1]}::${split[2]}::${split[3]}`,
          title: split[4],
          id: catalog.id,
        };
      }),
    );
  }
  async search(word: string, catalogCod: string) {
    const response: ServiceProps[] = await this.prismaService.service.findMany({
      orderBy: {
        name: 'asc',
      },
      where: {
        name: {
          contains: catalogCod,
        },
        OR: [
          {
            name: {
              contains: word,
            },
          },
        ],
      },
    });

    return await Promise.all(
      response.map((catalog: ServiceProps) => {
        const split = catalog.name.split('::');

        return {
          cod: split[0] + split[1] + split[2] + split[3],
          title: split[4],
          id: catalog.id,
        };
      }),
    );
  }
}
