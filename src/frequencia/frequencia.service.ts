import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FrequenciaServiceInterface } from './frequencia.interface';

@Injectable()
export class FrequenciaService implements FrequenciaServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}
  createFrequencia(): string {
    return 'service frequencia';
  }
  updateFrequencia(): string {
    return 'service frequencia';
  }
  getFrequencia(): string {
    return 'service frequencia';
  }
  searchFrequencia(): string {
    return 'service frequencia';
  }
  deleteFrequencia(): string {
    return 'service frequencia';
  }
  async getFrequenciaName(nome: string) {
    return await this.prismaService.frequencia.findFirstOrThrow({
      select: {
        id: true,
        nome: true,
      },
      where: {
        nome: nome,
      },
    });
  }
}
