import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PORTAGE_FAIXA_ETARIA,
  PORTAGE_TIPO,
  TIPO_PROTOCOLO,
} from './protocolo';
import { VALOR_PORTAGE, VBMAPP } from 'src/util/util';
import { dateFormatDDMMYYYY, formatadataPadraoBD } from 'src/util/format-date';

export enum TIPO_PROTOCOLO_ENUM {
  portage = 1,
  vbMapp = 2,
  pei = 3,
}

type DadosAtividade = {
  [nivel: number]: {
    [data: string]: {
      [programa: string]: {
        [atividade: string]: { percentual: number };
      };
    };
  };
};

@Injectable()
export class ProtocoloService {
  constructor(private readonly prismaService: PrismaService) {}

  transformarParaEstruturaAninhadaCheckbox(array) {
    const agrupadoPorTipoEFaixaEtaria = {};

    array.forEach((item) => {
      // Cria uma chave combinando `tipo` e `faixaEtaria`
      const tipoFaixa = `${item.tipo} ${item.faixaEtaria}`;

      // Se o agrupamento por `tipoFaixa` não existir, cria um novo nó
      if (!agrupadoPorTipoEFaixaEtaria[tipoFaixa]) {
        agrupadoPorTipoEFaixaEtaria[tipoFaixa] = {
          key: `${item.tipo}-${item.faixaEtaria}`, // Ajuste o key conforme necessário
          label: tipoFaixa,
          children: [],
        };
      }

      // Adiciona a atividade como um "child" no tipo + faixaEtaria
      agrupadoPorTipoEFaixaEtaria[tipoFaixa].children.push({
        key: `${item.atividadeId}-atividade`, // Ajuste o key conforme necessário
        label: item.atividade,
      });
    });

    // Retorna os valores agrupados em um array
    return Object.values(agrupadoPorTipoEFaixaEtaria);
  }

  calcularPercentual(itens) {
    const itensPreenchidos = itens.filter(
      (item) =>
        item.selected === VALOR_PORTAGE.sim ||
        item.selected === VALOR_PORTAGE.asVezes ||
        item.selected === VALOR_PORTAGE.nao,
    );

    if (itensPreenchidos.length === 0) {
      return 'Não se aplica';
    }

    const totalItens = itensPreenchidos.length;
    const totalCompletos = itensPreenchidos.filter(
      (item) => item.selected === '1',
    ).length;
    const totalMeio = itensPreenchidos.filter(
      (item) => item.selected === '0.5',
    ).length;
    const percentual = ((totalCompletos + totalMeio * 0.5) / totalItens) * 100;
    return `${Math.round(percentual)}%`;
  }

  agrupaRespostas(dados: any) {
    const resultado = {
      Socializacao: [],
      Cognicao: [],
    };

    ['Socialização', 'Cognição'].forEach((categoria) => {
      const categoriaResultado = [];
      const faixasEtarias = Object.keys(dados.resposta1[categoria]);
      const respostas = Object.keys(dados);

      faixasEtarias.forEach((faixaEtaria) => {
        const faixaData = [faixaEtaria];

        // Calcula as porcentagens para cada resposta (resposta1, resposta2, resposta3, resposta4)
        respostas.forEach((respostaKey) => {
          const itens = dados[respostaKey][categoria][faixaEtaria] || [];
          faixaData.push(this.calcularPercentual(itens));
        });

        categoriaResultado.push(faixaData);
      });

      if (categoria === 'Socialização') {
        resultado.Socializacao = categoriaResultado;
      } else if (categoria === 'Cognição') {
        resultado.Cognicao = categoriaResultado;
      }
    });

    return resultado;
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

  mergeAtividadesVBMapp = (data1: any, data2: any) => {
    const mergedData = {};

    // Combina as chaves dos dois objetos (programas)
    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    allKeys.forEach((key) => {
      const list1 = data1[key] || [];
      const list2 = data2[key] || [];

    //   if (key === 'mando') {
    // console.log(data1);
        
    //   }

      // Cria um mapa para mesclar os itens por id, prevalecendo os do segundo array
      const map = new Map();
      list2.forEach((item) => map.set(item.id, item)); // itens do segundo array prevalecem
      list1.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item); // adiciona itens novos do primeiro array
        }
      });

      // Converte o mapa em um array e adiciona à chave correspondente
      mergedData[key] = Array.from(map.values());
    });

    

    return mergedData;
  };

  preencherRespostasComPerguntas(respostas, perguntas) {
    // Cria uma cópia das respostas para modificar sem afetar o original
    const respostasCompletas = JSON.parse(JSON.stringify(respostas));

    // Itera sobre cada nível no objeto de respostas
    for (const nivel in respostasCompletas) {
      // Itera sobre cada data no nível
      for (const data in respostasCompletas[nivel]) {
        // Itera sobre cada programa no objeto de perguntas
        for (const programa in perguntas) {
          // Verifica se o programa já existe na data, caso contrário, inicializa-o
          if (!respostasCompletas[nivel][data][programa]) {
            respostasCompletas[nivel][data][programa] = {};
          }

          // Itera sobre cada pergunta dentro do programa
          perguntas[programa].forEach((pergunta) => {
            const perguntaNome = pergunta.nome;

            // Verifica se a pergunta já existe no programa dentro da data, caso contrário, inicializa com `percentual: 0`
            if (!respostasCompletas[nivel][data][programa][perguntaNome]) {
              respostasCompletas[nivel][data][programa][perguntaNome] = {
                percentual: 0,
              };
            }
          });
        }
      }
    }

    return respostasCompletas;
  }

  async filter(body: any, page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    switch (body.protocoloId) {
      case TIPO_PROTOCOLO_ENUM.portage:
        const resultPortage: any = await prisma.portage.findMany({
          select: {
            id: true,
            resposta1: true,
            resposta2: true,
            resposta3: true,
            resposta4: true,
            respostaDate1: true,
            respostaDate2: true,
            respostaDate3: true,
            respostaDate4: true,
            paciente: {
              select: {
                id: true,
                nome: true,
                dataNascimento: true,
              },
            },
          },
          where: {
            pacienteId: body.pacienteId,
          },
        });

        if (!resultPortage.length) return null;

        const oneResult = resultPortage[0];

        if (body.type === 'pdf') {
          const ref: any = {};
          const headers = [''];

          if (oneResult.resposta1) {
            ref.resposta1 = oneResult.resposta1;
            headers.push(
              `Avaliação ${dateFormatDDMMYYYY(oneResult.respostaDate1)}`,
            );
          }
          if (Boolean(oneResult.resposta2)) {
            ref.resposta2 = oneResult.resposta2;
            headers.push(
              `Reavaliação ${dateFormatDDMMYYYY(oneResult.respostaDate2)}`,
            );
          }
          if (Boolean(oneResult.resposta3)) {
            ref.resposta3 = oneResult.resposta3;
            headers.push(
              `Reavaliação ${dateFormatDDMMYYYY(oneResult.respostaDate3)}`,
            );
          }
          if (Boolean(oneResult.resposta4)) {
            ref.resposta4 = oneResult.resposta4;
            headers.push(
              `Reavaliação ${dateFormatDDMMYYYY(oneResult.respostaDate4)}`,
            );
          }

          const result: any = this.agrupaRespostas(ref);
          result.headers = headers;
          result.paciente = {
            ...oneResult.paciente,
            dataNascimento: dateFormatDDMMYYYY(
              oneResult.paciente.dataNascimento,
            ),
          };
          return result;
        }

        const portage: any = {
          paciente: oneResult.paciente,
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

        return portage;

      case TIPO_PROTOCOLO_ENUM.pei:
        const result = await prisma.pei.findMany({
          where: {
            pacienteId: body.pacienteId,
          },
        });

        return result;

      case TIPO_PROTOCOLO_ENUM.vbMapp:
        if (body.type === 'pdf') {
          const [dropdown, preenchidoLista]: any = await Promise.all([
            this.vbmapDropdown(),
            this.filterVbmapp(body),
          ]);

          const formated = this.gerarRelatorioVbmapp(preenchidoLista);

          const mergedData = this.preencherRespostasComPerguntas(
            formated,
            dropdown,
          );

          const result: any = {
            data: { ...mergedData },
          };

          if (preenchidoLista.length) {
            result.paciente = {
              ...preenchidoLista[0].paciente,
              dataNascimento: dateFormatDDMMYYYY(
                preenchidoLista[0].paciente.dataNascimento,
              ),
            };
          }

          return result;
        }

        const [dropdown, preenchidoLista, existeResposta] = await Promise.all([
          this.vbmapDropdown(body.nivel),
          this.filterVbmapp(body),
          this.filterVbmapp({
            pacienteId: body.pacienteId,
            existeResposta: true,
          }),
        ]);


        // console.log(preenchidoLista);


        const mergedData = this.mergeAtividadesVBMapp(
          dropdown,
          preenchidoLista,
        );

        const resultMergedData = {
          existeResposta,
          data: mergedData,
        };

        return resultMergedData;
    }
  }

  filterDataBySelected(data: any) {
    const result = {};

    // Percorre cada portage (ex: "Cognição", "Socialização")
    for (const programa in data) {
      
      const faixasEtarias = data[programa];
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
        result[programa] = filteredFaixasEtarias;
      }
    }

    return result;
  }

  convertToTreeStructure(filteredData: any) {
    const result = [];
    let metaIndex = 0; // Contador para meta
  
    // Percorre o portage (ex: "Cognição", "Socialização")
    for (const programa in filteredData) {
      const faixasEtarias = filteredData[programa];
  
      // Percorre as faixas etárias dentro do portage
      for (const faixaEtaria in faixasEtarias) {
        const atividades = faixasEtarias[faixaEtaria];
        const children = [];
        let subItemIndex = 0; // Contador para sub-item dentro de cada meta
  
        // Percorre cada atividade dentro da faixa etária
        atividades.forEach((activity, index) => {
          // Gera a chave base para o item atual
          const itemKey = `${metaIndex}-meta-${index}-sub-item-${subItemIndex}`;
  
          // Cria o nó do item pai
          const node: any = {
            key: itemKey,
            label: activity.nome,
          };
  
          // Se houver subitems preenchidos, adiciona-os como children
          if (activity.subitems && Array.isArray(activity.subitems) && activity.subitems.length > 0) {
            node.permiteSubitens = true;
            node.children = []; // Cria o array para os subitens

            node.procedimentoEnsinoId = activity.procedimentoEnsinoId
            node.estimuloDiscriminativo = activity.estimuloDiscriminativo
            node.estimuloReforcadorPositivo = activity.estimuloReforcadorPositivo
            node.resposta = activity.resposta
            node.programaId = activity.programaId
  
            activity.subitems.forEach((subitem, subIndex) => {
              // Gera uma chave para cada subitem (pode ser ajustado conforme a necessidade)
              const subItemKey = `${itemKey}-${subIndex}`;
              node.children.push({
                key: subItemKey,
                label: subitem.nome,
              });
            });
          }
  
          children.push(node);
          subItemIndex++; // Incrementa o contador de sub-item
        });
  
        // Adiciona o nó de meta com os children (atividades) processados
        result.push({
          key: `${metaIndex}-meta`, // Chave da meta
          label: `${programa} ${faixaEtaria}`,
          children: children,
        });
  
        metaIndex++; // Incrementa o contador de meta
      }
    }
  
    return result;
  }

  async filterMeta(body: any) {
    const prisma = this.prismaService.getPrismaClient();

    switch (body.protocoloId) {
      case TIPO_PROTOCOLO_ENUM.portage:
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
            pacienteId: body.pacienteId,
          },
        });

        if (!resultPortage) {
          return [];
        }

        const oneResult = resultPortage;
        const portage: any = {
          paciente: body.pacienteId,
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

        const convertToTree = this.convertToTreeStructure(filter);

        return convertToTree;

      case TIPO_PROTOCOLO_ENUM.pei:
        const result = await prisma.pei.findMany({
          where: {
            pacienteId: body.pacienteId,
          },
        });

        return result;

      case TIPO_PROTOCOLO_ENUM.vbMapp:
        const resultVBMapp = await prisma.vBMappResultado.findMany({
          select: {
            id: true,
            respostaSessao: true,
            vbmapp: true,
            createdAt: true,

            estimuloDiscriminativo : true,
            resposta               : true,
            estimuloReforcadorPositivo: true,
            procedimentoEnsinoId: true,
          
            subitems: true,

            paciente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          where: {
            pacienteId: body.pacienteId,
            NOT: {
              resposta: VBMAPP.um.toString(),
            },
          },
        });

        return this.formatDataVBMapMeta(resultVBMapp);
    }
  }

   formatDataVBMapMeta(dataArray: any[]): any[] {
    const groupedData = dataArray.reduce((acc, item) => {
      const { nivel, programa, id, nome } = item.vbmapp;
      const { respostaSessao, subitems } = item;
  
      const nivelKey = `nivel-${nivel}`;
      const programaKey = `programa-${programa}`;
      const metaKey = `meta-${id}`;
  
      // Verifica se o nível já existe no acumulador
      if (!acc[nivelKey]) {
        acc[nivelKey] = {
          key: `${nivel}-nivel`,
          label: `Nível ${nivel}`,
          children: {},
        };
      }
  
      // Verifica se o programa já existe dentro do nível
      if (!acc[nivelKey].children[programaKey]) {
        acc[nivelKey].children[programaKey] = {
          key: `${nivel}-nivel-${id}-programa-${programa}`,
          label: `${programa.charAt(0).toUpperCase() + programa.slice(1)}`,
          children: [],
        };
      }
  
      // Cria o objeto da meta
      const metaObj: any = {
        key: `${nivel}-nivel-${id}-programa-${programa}-${metaKey}`,
        label: nome,
      };
  
      // Se houver subitems, adiciona um children
      if (subitems && subitems.length > 0) {
        // metaObj.permiteSubitens = true
           
        metaObj.children = subitems.map((subitem: any, index: number) => ({
          key: `${nivel}-nivel-${id}-programa-${programa}-${metaKey}-subitem-${index}`,
          label: subitem.nome,
          permiteSubitens: true
        }));
      }
  
      // Adiciona a meta dentro do programa
      acc[nivelKey].children[programaKey].children.push(metaObj);
  
      return acc;
    }, {});
  
    // Converte o objeto para array
    return Object.values(groupedData).map((nivel: any) => ({
      ...nivel,
      children: Object.values(nivel.children),
    }));
  }
  

  async createOrUpdatePostage(body: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();
    const pacienteId = body.pacienteId.id;

    const now = new Date();

    try {
      // Busca registros existentes para o paciente
      const registrosExistentes = await prisma.portage.findMany({
        where: { pacienteId: pacienteId },
      });

      if (registrosExistentes.length) {
        const registro = registrosExistentes[0];

        // Verifica qual campo de resposta está vazio e salva no próximo disponível
        const dadosAtualizados: any = {};
        if (!registro.resposta2) {
          dadosAtualizados.resposta2 = body.portage;
          dadosAtualizados.respostaDate2 = now;
        } else if (!registro.resposta3) {
          dadosAtualizados.resposta3 = body.portage;
          dadosAtualizados.respostaDate3 = now;
        } else if (!registro.resposta4) {
          dadosAtualizados.resposta4 = body.portage;
          dadosAtualizados.respostaDate4 = now;
        } else {
          // Opcional: trate o caso onde todas as respostas estão preenchidas
          throw new Error(
            'Todas as respostas já estão preenchidas para este paciente.',
          );
        }

        // Atualiza o registro com a próxima resposta disponível
        await prisma.portage.update({
          data: dadosAtualizados,
          where: { id: registro.id },
        });
      } else {
        // Cria um novo registro caso não exista
        await prisma.portage.create({
          data: {
            resposta1: body.portage,
            respostaDate1: now,
            pacienteId: pacienteId,
          },
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async update(body: any, usuarioId: number) {
    const prisma = this.prismaService.getPrismaClient();

    // await prisma.portage.create({
    //   data: {
    //     ...body,
    //     metas: JSON.stringify(body.metas),
    //     terapeutaId: Number(terapeutaId),
    //   },
    // });
  }

  groupedData(data: any) {
    return data.reduce((acc, item) => {
      const { programa, faixaEtaria } = item;

      // Verifica se a chave portage já existe
      if (!acc[programa]) {
        acc[programa] = {};
      }

      // Verifica se a chave faixaEtaria já existe dentro de portage
      if (!acc[programa][faixaEtaria]) {
        acc[programa][faixaEtaria] = [];
      }

      // Adiciona o item ao grupo correspondente
      acc[programa][faixaEtaria].push(item);

      return acc;
    }, {});
  }

  async dropdown() {
    const prisma = this.prismaService.getPrismaClient();
    const result = await prisma.portageAtividades.findMany({
      select: {
        id: true,
        nome: true,
        programa: true,
        permiteSubitens: true,
        faixaEtaria: true,
      }
    });

    return this.groupedData(result);


  }

  agrupadoPorPrograma(atividades: any) {
    return atividades.reduce((acc, atividade) => {
      const programaNome = atividade.programa;

      if (!acc[programaNome]) {
        acc[programaNome] = [];
      }

      acc[programaNome].push(atividade);
      return acc;
    }, {});
  }

  async vbmapDropdown(nivel?: number) {
    const prisma = this.prismaService.getPrismaClient();
    const filter = nivel ? { nivel: Number(nivel) } : {};

    const result = await prisma.vBMappAtividades.findMany({
      select: {
        id: true,
        nome: true,
        nivel: true,
        programa: true,
        permiteSubitens: true,
        createdAt: true,
      },
      where: {
        ...filter,
      },
    });

    return this.agrupadoPorPrograma(result);
  }

  async vbmapCreate(dados, terapeutaId) {
    const prisma = this.prismaService.getPrismaClient();
    

    try {
      for (const programa in dados.vbmapp) {

        for (const atividade of dados.vbmapp[programa]) {
    
          if (atividade.selected !== undefined) {
            let complemento = {}

            if (atividade?.subitems && atividade?.subitems?.length) {
              complemento = {
  
                subitems: atividade.subitems
              }
            }


            await prisma.vBMappResultado.create({
              data: {
                vbmappId: atividade.id,
                respostaSessao: atividade.selected,
                pacienteId: dados.pacienteId,
                usuarioId: Number(terapeutaId),
                estimuloDiscriminativo: atividade?.estimuloDiscriminativo,
                estimuloReforcadorPositivo: atividade?.estimuloReforcadorPositivo,
                procedimentoEnsinoId: atividade?.procedimentoEnsinoId,
                resposta: atividade?.resposta,
                ...complemento
              },
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  gerarRelatorioVbmapp(dados) {
    // Estrutura do relatório
    const relatorio: any = {};

    dados.forEach((item) => {
      const nivel = item.vbmapp.nivel;
      const programa = item.vbmapp.programa;
      const atividadeNome: any = item.vbmapp.nome;
      const data = dateFormatDDMMYYYY(item.createdAt); // Extrai a data (yyyy-mm-dd)
      const resposta = parseFloat(item.respostaSessao);

      // Verifica se o nível já está no relatório
      if (!relatorio[nivel]) {
        relatorio[nivel] = {};
      }

      // Verifica se a data já está dentro do nível
      if (!relatorio[nivel][data]) {
        relatorio[nivel][data] = {};
      }

      // Verifica se o programa já está dentro da data
      if (!relatorio[nivel][data][programa]) {
        relatorio[nivel][data][programa] = {};
      }

      // Verifica se a atividade já está no programa para essa data
      if (!relatorio[nivel][data][programa][atividadeNome]) {
        relatorio[nivel][data][programa][atividadeNome] = {
          soma: 0,
          contador: 0,
        };
      }

      // Adiciona a resposta à atividade
      const atividade = relatorio[nivel][data][programa][atividadeNome];
      atividade.soma += resposta;
      atividade.contador += 1;
    });

    // Calcula o percentual para cada atividade e formata o resultado
    for (const nivel in relatorio) {
      for (const data in relatorio[nivel]) {
        for (const programa in relatorio[nivel][data]) {
          for (const atividade in relatorio[nivel][data][programa]) {
            const atividadeData: any =
              relatorio[nivel][data][programa][atividade];
            const mediaPercentual =
              (atividadeData.soma / atividadeData.contador) * 100;
            relatorio[nivel][data][programa][atividade] = {
              percentual: Math.round(mediaPercentual),
            };
          }
        }
      }
    }

    return relatorio;
  }

  async filterVbmapp(filter: any) {
    const prisma = this.prismaService.getPrismaClient();
    const vbmapp = filter.nivel
      ? {
          vbmapp: {
            nivel: Number(filter.nivel),
          },
        }
      : {};

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
        pacienteId: filter.pacienteId,
        ...vbmapp,
      },
    });

    if (filter.type === 'pdf') {
      return result;
    }

    if (filter.existeResposta) {
      return Boolean(result.length);
    }

    return this.transformDataFilterVBMapp(result);
  }

  async tipoPortagedropdown() {
    return PORTAGE_TIPO;
  }

  async faixaEtariadropdown() {
    return PORTAGE_FAIXA_ETARIA;
  }

  async tipoProtocoloropdown() {
    return TIPO_PROTOCOLO;
  }
}
