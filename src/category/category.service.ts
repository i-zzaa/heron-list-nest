import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CategoryServiceInterface } from './category.interface';
import { ServiceService } from 'src/service/service.service';
import { setIconCatalog } from 'src/util/util';

@Injectable()
export class CategoryService implements CategoryServiceInterface {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly serviceService: ServiceService,
  ) {}

  async get() {
    const service = await this.serviceService.getAll();
    const arrUnique = new Set();
    const categoryList = [];

    for (const category of service) {
      const split = category.name.split('::');

      if (split.length === 2 && !arrUnique.has(split[1])) {
        const item = setIconCatalog(category);

        arrUnique.add(split[1]);
        categoryList.push({
          cod: `${split[0]}::${split[1]}::`,
          title: split[1],
          id: category.id,
          icon: item.icon,
        });
      }
    }

    // Ordenar por title em ordem ascendente
    categoryList.sort((a, b) => a.title.localeCompare(b.title));

    return categoryList;
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
