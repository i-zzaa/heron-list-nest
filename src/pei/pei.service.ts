import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { METAS, PROCEDIMENTO_ENSINO } from './procedimentoEnsino';

@Injectable()
export class PeiService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    await prisma.pei.create({
      data: {
        ...body,
        // metas: JSON.stringify(body.metas),
        metas: body.metas,
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
        procedimentoEnsinoId: true,
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
      // item.metas = JSON.parse(item.metas);
      // item.metas = item.metas;
      item.procedimentoEnsino = PROCEDIMENTO_ENSINO.filter(
        (pe: any) => pe.id === item.procedimentoEnsinoId,
      )[0];
    });

    return result;
  }

  async update({ data }: any) {
    const prisma = this.prismaService.getPrismaClient();

    // const payload = { ...data, metas: JSON.stringify(data.metas) };
    const payload = { ...data, metas: data.metas };

    return await prisma.pei.update({
      data: payload,
      where: {
        id: data.id,
      },
    });
  }

  async getActivity(calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.findFirst({
      select: {
        atividades: true,
        selectedKeys: true,

        maintenance: true,
        selectedMaintenanceKeys: true,

        portage: true,
        selectedPortageKeys: true,

        vbmapp: true,
      },
      where: {
        calendarioId,
      },
    });
  }

  async createAtividadeSessao(data: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.atividadeSessao.create({
      data: {
        ...data,
        terapeutaId,
        atividades: data.atividades,
        selectedKeys: data.selectedKeys,

        maintenance: data.maintenance || [],
        selectedMaintenanceKeys: data.selectedMaintenanceKeys || {},
        peisIds: JSON.stringify(data.peisIds),
      },
    });
  }

  async updateAtividadeSessao(data: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const atividade = await prisma.atividadeSessao.findFirst({
      where: { calendarioId: data.calendario },
    });

    return await prisma.atividadeSessao.update({
      data: {
        ...data,
        terapeutaId,
        atividades: data.atividades,
        selectedKeys: data.selectedKeys,
        maintenance: data.maintenance,
        selectedPortageKeys: data.selectedPortageKeys,
        portage: data.portage,
        selectedMaintenanceKeys: data.selectedMaintenanceKeys,
        peisIds: JSON.stringify(data.peisIds),
      },
      where: {
        id: atividade.id,
      },
    });
  }

  // getAllKeys(arr: any) {
  //   let current: string[] = [];

  //   console.log(arr);

  //   arr.forEach((item: any) => {
  //     current.push(item.key); // Pega a chave do item atual

  //     // Se o item tiver children, faz a recursão
  //     if (item.children) {
  //       current = current.concat(this.getAllKeys(item.children));
  //     }
  //   });

  //   return current;
  // }

  filterTree(data: any, keys: any) {
    let allKeysMaintenance = Object.keys(keys);

    return data
      .map((item: any) => {
        if (item.children) {
          const filteredChildren = this.filterTree(item.children, keys);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
        }
        // Verifica se o item é a última camada e está em selectedMaintenanceKeys
        if (allKeysMaintenance.includes(item.key)) {
          return item;
        }
        return null;
      })
      .filter((item: any) => item !== null);
  }

  filterSelectedItemsTree(data: any, keys: any) {
    return data
      .map((item: any) => {
        if (item.children) {
          // Recursivamente filtra os filhos
          const filteredChildren = this.filterSelectedItemsTree(
            item.children,
            keys,
          );

          // Se houver filhos filtrados, monta o nó com os filhos
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
        }

        // Verifica se o item (última camada) está marcado como `checked = true`
        if (keys[item.key]?.checked) {
          return item;
        }

        return null;
      })
      .filter((item: any) => item !== null); // Remove nós nulos
  }

  async activitySession(calendarioId: number) {
    const prisma = this.prismaService.getPrismaClient();
    const result: any = await prisma.atividadeSessao.findMany({
      select: {
        atividades: true,
        maintenance: true,
        portage: true,
        selectedPortageKeys: true,
        selectedMaintenanceKeys: true,
        selectedVbMappKeys: true,
        vbmapp: true,
      },
      where: {
        // calendarioId: calendarioId,
        pacienteId: calendarioId,
      },
    });

    result.map((item) => {
      // let maintenanceParse = JSON.parse(item.maintenance);
      let maintenanceParse = item.maintenance;
      let maintenance = [];
      // const selectedMaintenanceKeys = JSON.parse(item.selectedMaintenanceKeys);
      const selectedMaintenanceKeys = item.selectedMaintenanceKeys;

      if (maintenanceParse.length > 0) {
        maintenance = this.filterTree(
          maintenanceParse,
          selectedMaintenanceKeys,
        );
      }

      let portageParse = item.portage;
      let portage = [];

      if (portageParse.length) {
        const selectedPortageKeys = item.selectedPortageKeys;

        portage = this.filterSelectedItemsTree(
          portageParse,
          selectedPortageKeys,
        );
      }

      let vbMappParse = item.vbmapp;
      let vbMapp = [];

      if (vbMappParse.length) {
        const selectedVbMappKeys = item.selectedVbMappKeys;

        vbMapp = this.filterSelectedItemsTree(vbMappParse, selectedVbMappKeys);
      }

      item.atividades = item.atividades;
      item.maintenance = maintenance;
      item.portage = portage;
      item.vbmapp = vbMapp;
      item.selectedMaintenanceKeys = selectedMaintenanceKeys;
    });

    return result[0];
  }

  getProcedimentoEnsino() {
    return PROCEDIMENTO_ENSINO;
  }
  getMetas() {
    return METAS;
  }
}
