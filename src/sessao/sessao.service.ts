import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SessaoService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(pacienteId: number) {
    const data = await this.prismaService.sessao.findMany({
      select: {
        id: true,
        resumo: true,
        paciente: {
          select: {
            nome: true,
            responsavel: true,
          },
        },
        programa: true,
        evento: {
          select: {
            especialidade: true,
            dataInicio: true,
            terapeuta: true,
          },
        },
        atividadeId: true,
        terapeuta: {
          select: {
            usuario: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });
    return data;
  }

  async create(body: any) {
    return await this.prismaService.sessao.create({
      data: body,
    });
  }

  async createProtocolo(body: any) {
    return await this.prismaService.protocolo.create({
      data: {
        atividadeNome: body.atividade.nome,
        programaId: body.programaId,
        atividadeId: body.atividade.id,
        pacienteId: body.pacienteId,
        terapeutaId: body.terapeutaId,
      },
    });
  }

  async update(body: any) {
    // return await this.prismaService.periodo.update({
    //   data: {
    //     nome: body.nome,
    //   },
    //   where: {
    //     id: Number(body.id),
    //   },
    // });
  }

  async delete(id: number) {
    return await this.prismaService.sessao.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async getProtocolo(pacienteId: number) {
    const result = await this.prismaService.protocolo.findMany({
      select: {
        id: true,
        paciente: true,
        programa: true,
        atividadeId: true,
        atividadeNome: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });

    const group = {};
    result.map((item: any, index: number) => {
      if (group[item.programa.id]) {
        group[item.programa.id].children.push({
          label: item.atividadeNome,
          key: `${item.id}-${item.atividadeId}`,
          data: item.atividadeNome,
          id: item.atividadeId,
        });
      } else {
        group[item.programa.id] = {
          key: `${item.id}`,
          label: item.programa.nome,
          data: item.programa.nome,
          id: item.programa.id,
          children: [
            {
              label: item.atividadeNome,
              key: `${item.id}-${item.atividadeId}`,
              data: item.atividadeNome,
              id: item.atividadeId,
            },
          ],
        };
      }
    });

    const arrayDeValores = Object.keys(group).map((key) => group[key]);

    return arrayDeValores;
  }
}
