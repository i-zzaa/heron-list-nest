import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PeiService {
  constructor(private readonly prismaService: PrismaService) {}

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

  async delete(programaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    await prisma.pei.delete({
      where: {
        id: Number(programaId),
      },
    });
  }

  async filtro({ paciente }: any) {
    const prisma = this.prismaService.getPrismaClient();

    const result = await prisma.pei.findMany({
      select: {
        id: true,
        estimuloDiscriminativo: true,
        estimuloReforcadorPositivo: true,
        metas: true,
        programa: {
          select: {
            nome: true,
            id: true,
          },
        },
        resposta: true,
        terapeuta: true,
        paciente: {
          select: {
            nome: true,
            id: true,
          },
        },
      },
      where: {
        pacienteId: Number(paciente.id),
      },
    });

    result.map((item: any) => {
      item.metas = JSON.parse(item.metas);
    });

    return result;
  }

  async update({ data }: any) {
    const prisma = this.prismaService.getPrismaClient();

    const payload = { ...data, metas: JSON.stringify(data.metas) };

    return await prisma.pei.update({
      data: payload,
      where: {
        id: data.id,
      },
    });
  }

  async createAtividadeSessao(data: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const result = await prisma.atividadeSessao.create({
      data: {
        ...data,
        terapeutaId,
        atividades: JSON.stringify(data.atividades),
        selectedKeys: JSON.stringify(data.selectedKeys),
        peisIds: JSON.stringify(data.peisIds),
      },
    });
    console.log(result);
  }
}
