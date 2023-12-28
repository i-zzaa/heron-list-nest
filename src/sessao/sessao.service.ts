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
        sessao: true,
        paciente: {
          select: {
            nome: true,
            responsavel: true,
          },
        },
        evento: {
          select: {
            especialidade: true,
            dataInicio: true,
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
        },
      },
      where: {
        pacienteId: Number(pacienteId),
      },
    });

    const result = await Promise.all(
      data.map(async (item: any) => {
        const sessoes = JSON.parse(item.sessao);
        item.sessoes = await Promise.all(
          sessoes.map((sessao: any) => {
            sessao.children.map((children: any) => {
              const consecutive3 =
                children.loop[0] && children.loop[1] && children.loop[2];
              const trueCount = children.loop.filter(
                (child: any) => !!child,
              ).length;

              children.porcentagem = consecutive3
                ? 100
                : (trueCount / children.loop.length) * 100;

              return children;
            });

            return sessao;
          }),
        );

        return item;
      }),
    );

    return result;
  }

  async create(body: any) {
    return await this.prismaService.sessao.create({
      data: body,
    });
  }

  async createProtocolo(body: any) {
    return await this.prismaService.protocolo.createMany({
      data: body,
    });
  }

  async createAtividadeSessao(body: any) {
    return await this.prismaService.atividadeSessao.createMany({
      data: body,
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

  async getProtocoloByPacient(pacienteId: number) {
    const result: any = await this.prismaService.protocolo.findMany({
      select: {
        id: true,
        protocolo: true,
        protocoloSet: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const last = result.at(-1);
    return {
      ...last,
      protocolo: JSON.parse(last.protocolo),
      protocoloSet: JSON.parse(last.protocoloSet),
    };
  }

  async getAtividadeSessaoByPacient(pacienteId: number) {
    const result: any = await this.prismaService.atividadeSessao.findMany({
      select: {
        id: true,
        atividadeSessao: true,
        atividadeSessaoSet: true,
      },
      where: {
        pacienteId: Number(pacienteId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const last = result.at(-1);
    const atividadeSessao = JSON.parse(last.atividadeSessao);

    atividadeSessao.map((task: any) => {
      task.children.map((child: any) => {
        child.loop = [
          'no value',
          'no value',
          'no value',
          'no value',
          'no value',
          'no value',
          'no value',
          'no value',
          'no value',
          'no value',
        ];
      });
    });

    return {
      ...last,
      atividadeSessao,
      atividadeSessaoSet: JSON.parse(last.atividadeSessaoSet),
    };
  }
}
