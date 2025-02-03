import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { METAS, PROCEDIMENTO_ENSINO } from './procedimentoEnsino';
import { TIPO_PROTOCOLO, TIPO_PROTOCOLO_ID } from 'src/protocolo/protocolo';

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

  async filtro({ paciente, protocoloId }: any) {
    const prisma = this.prismaService.getPrismaClient();

    switch (protocoloId.id) {
      case TIPO_PROTOCOLO_ID.pei :
        const resultPei =  await prisma.pei.findMany({
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

        resultPei.map((item: any) => {
          // item.metas = JSON.parse(item.metas);
          // item.metas = item.metas;
          item.procedimentoEnsino = PROCEDIMENTO_ENSINO.filter(
            (pe: any) => pe.id === item.procedimentoEnsinoId,
          )[0];
        });
    
        return resultPei;
        
      case TIPO_PROTOCOLO_ID.portage :
        
        break;
    
      default:

      
        break;
    }




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
      let filteredChildren: any[] = [];
  
      // Verifica e filtra a propriedade `children` (caso exista)
      if (item.children) {
        filteredChildren = this.filterSelectedItemsTree(item.children, keys);
      }
  
      // Verifica e filtra a propriedade `subitems` (caso exista)
      if (item.subitems) {
        const filteredSubitems = this.filterSelectedItemsTree(item.subitems, keys);
        // Se já houver children, podemos mesclar ou, se preferir, manter separado,
        // conforme o seu modelo. Aqui mesclamos ambos:
        filteredChildren = [...filteredChildren, ...filteredSubitems];
      }
  
      // Se houver filhos filtrados, monta o nó com os filhos (mantendo o conceito de árvore)
      if (filteredChildren.length > 0) {
        return { ...item, children: filteredChildren , subitems: item?.subitems};
      }
  
      // Caso não haja filhos (nem children nem subitems), verifica se o nó está marcado
      if (keys[item.key]?.checked) {
        return item;
      }
  
      return null;
    })
    .filter((item: any) => item !== null); // Remove nós nulos
  }

  async activitySession(pacienteId: number) {
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
        pacienteId: pacienteId,
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

      if (portageParse.length && item?.selectedPortageKeys) {
      const selectedPortageKeys = item.selectedPortageKeys;
        portage = this.filterSelectedItemsTree(
          portageParse,
          selectedPortageKeys,
        );        
      }

      let vbMappParse = item?.vbmapp;
      let vbMapp = [];

      if (vbMappParse.length && item?.selectedVbMappKeys) {

        const selectedVbMappKeys = item?.selectedVbMappKeys;

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
