import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CategoryServiceInterface } from './category.interface';
import { ServiceService } from 'src/service/service.service';

@Injectable()
export class CategoryService implements CategoryServiceInterface {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly serviceService: ServiceService,
  ) {}

  async get(cod: string) {
    const service = await this.serviceService.get(cod);
    return service;
  }

  async search(word: string, cod: string) {
    const service = await this.serviceService.search(word, cod);
    return service;
  }
}
