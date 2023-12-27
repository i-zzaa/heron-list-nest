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
        atividadeNome: body.atividadeNome,
        programaId: body.programaId,
        atividadeId: body.atividadeId,
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

  async getRepeticoes(pacienteId: number) {
    const result = await this.prismaService.sessaoPrograma.findMany({
      select: {
        id: true,
        paciente: true,
        sessaoId: true,
        programa: true,
        atividadeId: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });

    result.map((item: any, index: number) => {
      // const atividades = JSON.parse(item.atividades);

      // item.children = atividades.map((ativo: any, key: number) => {
      //   return {
      //     label: ativo.nome,
      //     key: `${item.id}-${ativo.id}`,
      //     data: ativo.nome,
      //     id: ativo.id,
      //   };
      // });
      item.key = `${item.id}`;
      item.label = item.programa.nome;
      item.data = item.nome;
      item.id = item.id;
      item.partialChecked = true;
    });

    return result;

    const data = await this.prismaService.sessaoPrograma.findMany({
      select: {
        id: true,
        paciente: {
          select: {
            nome: true,
            responsavel: true,
          },
        },
        programa: true,
        atividadeId: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });
    return data;
  }
}
