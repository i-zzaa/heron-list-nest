import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PORTAGE_FAIXA_ETARIA,
  PORTAGE_LIST,
  PORTAGE_TIPO,
  TIPO_PROTOCOLO,
} from './protocolo';
import { VALOR_PORTAGE } from 'src/util/util';
import { dateFormatDDMMYYYY } from 'src/util/format-date';

export enum TIPO_PROTOCOLO_ENUM {
  portage = 1,
  vbMapp = 2,
  pei = 3,
}

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
          const dados = await this.filterVbmapp(body);
          return this.gerarRelatorioVbmapp(dados);
        }

        const existe = await this.filterVbmapp(body);
        return existe.length;
    }
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
          (activity) => activity.selected !== '1',
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

  convertToTreeStructure(filteredData: any) {
    const result = [];
    let metaIndex = 0; // Contador para meta

    // Percorre o portage (ex: "Cognição", "Socialização")
    for (const portage in filteredData) {
      const faixasEtarias = filteredData[portage];

      // Percorre as faixas etárias dentro do portage
      for (const faixaEtaria in faixasEtarias) {
        const atividades = faixasEtarias[faixaEtaria];
        const children = [];
        let subItemIndex = 0; // Contador para sub-item dentro de cada meta

        // Percorre cada atividade dentro da faixa etária
        atividades.forEach((activity, index) => {
          children.push({
            key: `${metaIndex}-meta-${index}-sub-item-${subItemIndex}`, // Formata o key no estilo pedido
            label: activity.nome,
          });
          subItemIndex++; // Incrementa o contador de sub-item
        });

        // Adiciona ao resultado final no formato desejado
        result.push({
          key: `${metaIndex}-meta`, // Chave de meta
          label: `${portage} ${faixaEtaria}`,
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

        const oneResult = resultPortage;
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
        // return await prisma.vbmapp.findMany({
        //   where: {
        //     pacienteId: body.pacienteId,
        //   },
        // });
        break;
    }
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
      const { portage, faixaEtaria } = item;

      // Verifica se a chave portage já existe
      if (!acc[portage]) {
        acc[portage] = {};
      }

      // Verifica se a chave faixaEtaria já existe dentro de portage
      if (!acc[portage][faixaEtaria]) {
        acc[portage][faixaEtaria] = [];
      }

      // Adiciona o item ao grupo correspondente
      acc[portage][faixaEtaria].push(item);

      return acc;
    }, {});
  }

  async dropdown() {
    return this.groupedData(PORTAGE_LIST);
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

  async vbmapDropdown(nivel: number) {
    const prisma = this.prismaService.getPrismaClient();

    const result = await prisma.vBMappAtividades.findMany({
      select: {
        id: true,
        nome: true,
        nivel: true,
        programa: true,
      },
      where: {
        nivel: Number(nivel),
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
            await prisma.vBMappResultado.create({
              data: {
                vbmappId: atividade.id,
                resposta: atividade.selected,
                pacienteId: dados.pacienteId,
                usuarioId: Number(terapeutaId),
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
    // Agrupamento das respostas por programa e atividade
    const relatorio = {};

    dados.forEach((item) => {
      const programa = item.vbmapp.programa;
      const atividadeNome = item.vbmapp.nome;
      const resposta = parseFloat(item.resposta);

      // Verifica se o programa já está no relatório
      if (!relatorio[programa]) {
        relatorio[programa] = {};
      }

      // Verifica se a atividade já está no programa

      if (!relatorio[programa][atividadeNome]) {
        relatorio[programa][atividadeNome] = {
          nivel: item.vbmapp.nivel,
          soma: 0,
          contador: 0,
        };
      }

      // Adiciona a resposta à atividade
      relatorio[programa][atividadeNome].soma += resposta;
      relatorio[programa][atividadeNome].contador += 1;
    });

    // Calcula a média de preenchimento para cada atividade
    for (const programa in relatorio) {
      for (const atividade in relatorio[programa]) {
        const atividadeData = relatorio[programa][atividade];
        const mediaPercentual =
          (atividadeData.soma / atividadeData.contador) * 100;
        atividadeData.percentual = Math.round(mediaPercentual); // Arredonda para facilitar a exibição

        // Remove os campos desnecessários
        delete atividadeData.soma;
        delete atividadeData.contador;
      }
    }

    return relatorio;
  }

  async filterVbmapp(filter: any) {
    const prisma = this.prismaService.getPrismaClient();

    const result = await prisma.vBMappResultado.findMany({
      select: {
        id: true,
        resposta: true,
        vbmapp: true,
        paciente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      where: {
        pacienteId: filter.pacienteId,
      },
    });

    return result;
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
