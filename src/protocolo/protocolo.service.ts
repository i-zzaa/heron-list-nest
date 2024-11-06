import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PORTAGE_FAIXA_ETARIA,
  PORTAGE_LIST,
  PORTAGE_TIPO,
  TIPO_PROTOCOLO,
} from './protocolo';
import { VALOR_PORTAGE } from 'src/util/util';

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

  async filter(body: any, page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    switch (body.protocoloId) {
      case TIPO_PROTOCOLO_ENUM.portage:
        const portage = await prisma.portage.findMany({
          select: {
            id: true,
            portage: true,
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

        return portage[0];

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
        const data = await prisma.portage.findFirst({
          select: {
            id: true,
            portage: true,
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

        const filter = this.filterDataBySelected(data.portage);
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

    try {
      const registrosExistentes = await prisma.portage.findMany({
        where: { pacienteId: pacienteId },
      });

      if (registrosExistentes.length) {
        await prisma.portage.update({
          data: {
            portage: body.portage,
          },
          where: { id: registrosExistentes[0].id },
        });
      } else {
        await prisma.portage.create({
          data: {
            portage: body.portage,
            pacienteId: body.pacienteId.id,
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
