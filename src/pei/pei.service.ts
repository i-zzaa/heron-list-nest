import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { METAS, PROCEDIMENTO_ENSINO } from './procedimentoEnsino';
import { TIPO_PROTOCOLO, TIPO_PROTOCOLO_ID } from 'src/protocolo/protocolo';
import { VALOR_PORTAGE } from 'src/util/util';

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
        const resultPortage = await prisma.portage.findFirst({
          select: {
            id: true,
            resposta1: true,
            resposta2: true,
            resposta3: true,
            resposta4: true,
            paciente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          where: {
            pacienteId: paciente.pacienteId,
          },
        });

        if (!resultPortage) {
          return [];
        }

        const oneResult = resultPortage;
        const portage: any = {
          paciente: paciente.pacienteId,
          id: oneResult.id,
        };


        if (!oneResult.resposta2) {
          portage.portage = oneResult.resposta1;
        } else if (!oneResult.resposta3) {
          portage.portage = oneResult.resposta2;
        } else if (!oneResult.resposta4) {
          portage.portage = oneResult.resposta3;
        } else {
          portage.portage = oneResult.resposta4;
        }

        const filter = this.filterDataBySelected(portage.portage);
        const convertToTreeStructure = this.formatJsonPortageTelaPEI(filter, paciente)

        return convertToTreeStructure
    
      default:

      
        break;
    }
  }

  async formatJsonPortageTelaPEI(dados: any, paciente: any) {
    const transformedArray = [];
    const prisma = this.prismaService.getPrismaClient();
  

    for (const programaNome in dados) {
      const [programa] =  await prisma.programa.findMany({
        select: {
          id: true,
          nome: true,
        },
        where: {
          nome: programaNome
        }
      });

      const programaList = {
        id: 29,
        permiteSubitens: true,
        procedimentoEnsinoId: 2,
        estimuloDiscriminativo: "wrtttew",
        estimuloReforcadorPositivo: "ttewt",
        resposta: "Sentar e começar a brincar ",
        metas: [],
        programa,
        procedimentoEnsino: {}
      }
      const faixaEtariaObj = dados[programaNome];

      for (const faixaEtaria in faixaEtariaObj) {
        if (faixaEtariaObj.hasOwnProperty(faixaEtaria)) {
          const metas = faixaEtariaObj[faixaEtaria];

          metas.forEach(async(meta) => {
            const [procedimentoEnsino] = PROCEDIMENTO_ENSINO.filter(item => item.id === meta.procedimentoEnsinoId)

            
            programaList.estimuloDiscriminativo = meta.estimuloDiscriminativo
            programaList.procedimentoEnsinoId = meta.procedimentoEnsinoId
            programaList.estimuloReforcadorPositivo = meta.estimuloReforcadorPositivo
            programaList.resposta = meta.resposta
            programaList.procedimentoEnsino = procedimentoEnsino || null
            programaList.metas.push(
              {
                id: meta.id,
                name: "meta",
                type: "input-add",
                value: meta.nome,
                labelFor: "meta",
                subitems: meta?.subitems ? meta.subitems.map(subitem => ({
                  id: subitem.id,
                  name: "item",
                  type: "input-add",
                  value: subitem.nome,
                  labelFor: "item",
                  buttonAdd: true,
                  customCol: "col-span-5 sm:col-span-5",
                  labelText: "Item"
                })) : null,
                buttonAdd: true,
                customCol: "col-span-5 sm:col-span-5",
                labelText: "Meta"
              }
            )
          });
        }
      }

      transformedArray.push(programaList)
    }

    return transformedArray;
  }

    filterDataBySelected(data: any) {
      const result = {};
  
      // Percorre cada portage (ex: "Cognição", "Socialização")
      for (const portage in data) {
        
        const faixasEtarias = data[portage];
        const filteredFaixasEtarias = {};
  
        // Percorre cada faixa etária dentro do portage
        for (const faixaEtaria in faixasEtarias) {
          const atividades = faixasEtarias[faixaEtaria];
  
          // Filtra as atividades removendo aquelas que têm selected === "1"
          const filteredAtividades = atividades.filter(
            (activity) => activity.hasOwnProperty('selected') && activity.selected !== VALOR_PORTAGE.sim ,
          );
  
          // Adiciona a faixa etária ao resultado se ainda tiver atividades válidas
          if (filteredAtividades.length > 0) {
            filteredFaixasEtarias[faixaEtaria] = filteredAtividades;
          }
        }
  
        // Adiciona o portage ao resultado se ainda tiver faixas etárias válidas
        if (Object.keys(filteredFaixasEtarias).length > 0) {
          result[portage] = filteredFaixasEtarias;
        }
      }
  
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
      let filteredChildren: any[] = [];

      // Verifica e filtra a propriedade `children` (caso exista)
      if (item.children) {
        filteredChildren = this.filterSelectedItemsTree(item.children, keys);
      }
  
      // Verifica e filtra a propriedade `subitems` (caso exista)
      // if (item.subitems) {

      //   const filteredSubitems = this.filterSelectedItemsTree(item.subitems, keys);
      //   // Se já houver children, podemos mesclar ou, se preferir, manter separado,
      //   // conforme o seu modelo. Aqui mesclamos ambos:
      //   filteredChildren = [...filteredChildren, ...filteredSubitems];
      // }
  
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
        
        console.log(portage[0].children);
        
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
