import { Injectable } from '@nestjs/common';
import { ConvenioProps } from 'src/convenio/convenio.interface';
import { PrismaService } from 'src/prisma.service';
import { EspecialidadeServiceInterface } from './especialidade.interface';

@Injectable()
export class EspecialidadeService implements EspecialidadeServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async createEspecialidade(body: ConvenioProps) {
    let color = '';
    switch (body.nome.toUpperCase()) {
      case 'TO':
        color = '#ef6c00';
        break;
      case 'FONO':
        color = '#f6bf26';
        break;
      case 'PSICO':
        color = '#8e24aa';
        break;
      case 'PSICOPEDAG':
        color = '#000000';
        break;
      default:
        color = '#000000';
        break;
    }

    return await this.prismaService.especialidade.create({
      data: {
        ...body,
        cor: color,
      },
    });
  }
  async updateEspecialidade(body: ConvenioProps, id: number) {
    return await this.prismaService.especialidade.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(id),
      },
    });
  }
  async getEspecialidade() {
    return await this.prismaService.especialidade.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }
  async searchEspecialidade(word: string) {
    return await this.prismaService.especialidade.findMany({
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
