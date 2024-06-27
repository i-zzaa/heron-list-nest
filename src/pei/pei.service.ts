import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PeiService {
  constructor(private readonly prismaService: PrismaService) {}

  async dropdown() {
    return [
      { id: 1, nome: 'Mando' },
      { id: 2, nome: 'Tato' },
      { id: 3, nome: 'Ouvinte/VP' },
      { id: 4, nome: 'MTS' },
      { id: 5, nome: 'Brincar' },
      { id: 6, nome: 'Social' },
      { id: 7, nome: 'Imitação' },
      { id: 8, nome: 'Ecóico' },
      { id: 9, nome: 'LRFFC' },
      { id: 10, nome: 'INTRAV' },
      { id: 11, nome: 'Grupo' },
      { id: 12, nome: 'Ling' },
    ];
  }

  async create(body: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    await prisma.pei.create({
      data: {
        ...body,
        metas: JSON.stringify(body.metas),
        terapeutaId: Number(terapeutaId),
      },
    });
  }

  async filtro({ pacienteId }: any) {
    const prisma = this.prismaService.getPrismaClient();

    const result = await prisma.pei.findMany({
      // select: {},
      where: {
        pacienteId: Number(pacienteId.id),
      },
    });

    result.map((item: any) => {
      item.metas = JSON.parse(item.metas);
    });

    return result;
  }

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.pei.update({
      data: body,
      where: {
        id: body.id,
      },
    });
  }
}
