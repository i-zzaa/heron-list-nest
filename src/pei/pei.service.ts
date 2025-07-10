import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { METAS, PROCEDIMENTO_ENSINO } from './procedimentoEnsino';
import { TIPO_PROTOCOLO, TIPO_PROTOCOLO_ID } from 'src/protocolo/protocolo';
import { VALOR_PORTAGE } from 'src/util/util';

@Injectable()
export class PeiService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      await prisma.pei.create({
      data: {
        estimuloDiscriminativo: body.estimuloDiscriminativo,
        estimuloReforcadorPositivo: body.estimuloReforcadorPositivo,
        pacienteId: body.pacienteId,
        procedimentoEnsinoId: body.procedimentoEnsinoId,
        programaId: body.programaId,
        resposta: body.resposta,
        metas: body.metas,
        terapeutaId: Number(terapeutaId),
      },
    });
    } catch (error) {
       throw new HttpException(error, HttpStatus.NOT_FOUND)
    }
  }

  async delete(programaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    await prisma.pei.delete({
      where: {
        id: Number(programaId),
      },
    });
  }

  async filtro({ paciente, protocoloId, notSelected = [] }: any) {
    const prisma = this.prismaService.getPrismaClient();

    const protocoloIdCurrent = protocoloId.id || protocoloId

    switch (protocoloIdCurrent) {
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
            respostaPortage: true,
            paciente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          where: {
            pacienteId:  Number(paciente.id),
          },
          orderBy: {
            id: 'desc',
          },
        });

        if (!resultPortage) {
          return [];
        }

        const oneResult = resultPortage;
        const portage: any = {
          paciente,
          id: oneResult.id,
        };

        portage.portage = oneResult.respostaPortage;

        const filter = this.filterDataBySelected(portage.portage, notSelected);
        const convertToTreeStructure = this.formatJsonPortageTelaPEI(filter, paciente)

        return convertToTreeStructure
    
      default:
        const result = await prisma.vBMappResultado.findMany({
          select: {
            id: true,
            respostaSessao: true,
    
            estimuloDiscriminativo     : true,
            resposta                   : true,
            estimuloReforcadorPositivo : true,
            procedimentoEnsinoId  : true,
            subitems : true,
    
            vbmapp: true,
            createdAt: true,
            paciente: {
              select: {
                id: true,
                nome: true,
                dataNascimento: true,
              },
            },
          },
          where: {
            pacienteId: paciente.id,
          },
        });

        const transformDataFilterVBMapp = this.transformDataFilterVBMapp(result)
        const vbmPEI = this.transformJsonVBPPEI(transformDataFilterVBMapp)
      
        return vbmPEI
    }
  }

  transformJsonVBPPEI(inputJson: any): any {
    const transformedArray = [];

    for (const programaNome in inputJson) {
      if (inputJson.hasOwnProperty(programaNome)) {
        const metasArray = inputJson[programaNome];

        metasArray.forEach(meta => {
          const [procedimentoEnsino] = PROCEDIMENTO_ENSINO.filter((item: any) => item.id === meta.procedimentoEnsinoId)
          const transformedObject = {
            ...meta,
            id: meta.programaId, // Usando o programaId como ID
            permiteSubitens: meta.permiteSubitens,

            metas: metasArray.map(m => ({
              id: m.id,
              name: "meta",
              type: "input-add",
              value: m.nome,
              labelFor: "meta",
              subitems: m.subitems && m.subitems.length > 0 ? 
                m.subitems.map(subitem => ({
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
            })),
            programa: {
              id: meta.programaId,
              nome: programaNome
            },
            procedimentoEnsino          };

          transformedArray.push(transformedObject);
        });
      }
    }

    return transformedArray;
  }


  transformDataFilterVBMapp(data: any[]) {
    const result = {};

    data.forEach((item) => {
      
      const { estimuloDiscriminativo,
        respostaSessao,
        resposta              ,
        estimuloReforcadorPositivo,
        procedimentoEnsinoId,
        subitems, } = item;

        const { programa, id, nome, nivel } = item.vbmapp;


      const selected = respostaSessao;

      // Inicializa a categoria do programa se ainda não existe
      if (!result[programa]) {
        result[programa] = [];
      }

      // Verifica se o item já existe para evitar duplicatas
      const existingItem = result[programa].find((i) => i.id === id);

      if (existingItem) {
        // Se já existe e `selected` ainda não foi definido, adiciona
        if (!existingItem.selected) {
          existingItem.selected = selected;
        }
      } else {
        // Adiciona o item ao programa correspondente com ou sem `selected`
        result[programa].push({
          id,
          nome,
          nivel,
          programa,
          estimuloDiscriminativo,
          resposta              ,
          estimuloReforcadorPositivo,
          procedimentoEnsinoId,
          respostaSessao,
          subitems,

          ...(selected && { selected }),
        });
      }
    });

    return result;
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

    filterDataBySelected(data: any, notSelected: string[]) {
      const result = {};
  
      // Percorre cada portage (ex: "Cognição", "Socialização")
      for (const portage in data) {
        const faixasEtarias = data[portage];
        const filteredFaixasEtarias = {};

        // Percorre cada faixa etária dentro do portage
        for (const faixaEtaria in faixasEtarias) {
          const atividades = faixasEtarias[faixaEtaria];
  
          // Filtra as atividades removendo aquelas que têm selected === "1"
          let filteredAtividades = []
          if (notSelected.length) {
            filteredAtividades = atividades.filter(
              (activity) => activity.hasOwnProperty('selected') && notSelected.includes(activity.selected) ,
            );
          }else {
            filteredAtividades = atividades.filter(
              (activity) => activity.hasOwnProperty('selected'),
            );
          }

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

  async update(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.pei.update({
      data: {
        estimuloDiscriminativo: body.estimuloDiscriminativo,
        estimuloReforcadorPositivo: body.estimuloReforcadorPositivo,
        pacienteId: body.pacienteId,
        procedimentoEnsinoId: body.procedimentoEnsinoId,
        programaId: body.programaId,
        resposta: body.resposta,
        metas: body.metas,
        id: body.id
      },
      where: {
        id: body.id,
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
        selectedVbMappKeys: true,
      },
      where: {
        calendarioId,
      },
    });
  }

  async createAtividadeSessao(data: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    console.log(data);
    

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
    
    if (!atividade) {
      delete data.id
      return this.createAtividadeSessao(data, terapeutaId)
    }

    return await prisma.atividadeSessao.update({
      data: {
        ...data,
        terapeutaId,
        atividades: data.atividades,
        selectedKeys: data.selectedKeys,
        maintenance: data.maintenance,
        selectedPortageKeys: data.selectedPortageKeys || {},
        portage: data.portage,
        selectedMaintenanceKeys: data.selectedMaintenanceKeys || {},
        selectedVbMappKeys: data.selectedVbMappKeys || {},
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
