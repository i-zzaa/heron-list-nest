import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ConvenioProps, ConvenioServiceInterface } from './convenio.interface';

@Injectable()
export class ConvenioService implements ConvenioServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async createConvenio(body: ConvenioProps) {
    return await this.prismaService.convenio.create({
      data: body,
    });
  }
  async updateConvenio(body: ConvenioProps, id: number) {
    return await this.prismaService.convenio.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: id,
      },
    });
  }
  async getConvenio() {
    return await this.prismaService.convenio.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }
  async searchConvenio(word: string) {
    return await this.prismaService.convenio.findMany({
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
}
