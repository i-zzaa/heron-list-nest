import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CatalogServiceInterface } from './catalog.interface';
import { ServiceService } from 'src/service/service.service';
import { ServiceProps } from 'src/service/service.interface';
import { removeStringRepeted } from 'src/util/util';

@Injectable()
export class CatalogService implements CatalogServiceInterface {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly serviceService: ServiceService,
  ) {}

  async get() {
    const service: ServiceProps[] = await this.serviceService.getAll();
    const clearArr = await Promise.all(removeStringRepeted(service, 'name'));

    return await Promise.all(
      clearArr.map((catalog: ServiceProps) => {
        const split = catalog.name.split('::');

        return {
          cod: `${split[0]}::${split[1]}::${split[2]}`,
          title: split[2],
          id: catalog.id,
          description: split[3],
        };
      }),
    );
  }

  async search(word: string) {
    return await this.prismaService.general_catalog.findMany({
      orderBy: {
        name: 'asc',
      },
      where: {
        OR: [
          {
            name: {
              contains: word,
            },
          },
        ],
      },
    });
  }
}
