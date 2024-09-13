import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PORTAGE_FAIXA_ETARIA,
  PORTAGE_LIST,
  PORTAGE_TIPO,
  TIPO_PROTOCOLO,
} from './protocolo';

export enum TIPO_PROTOCOLO_ENUM {
  portage = 1,
  vbMapp = 2,
  pei = 3,
}

@Injectable()
export class ProtocoloService {
  constructor(private readonly prismaService: PrismaService) {}

  groupedArray(originalArray) {
    const agrupado = {};

    originalArray.forEach((item) => {
      const tipo = item.tipo;
      const faixaEtaria = item.faixaEtaria;
      const pacienteId = item.pacienteId;

      const chaveGrupo = `${tipo}-${faixaEtaria}-${pacienteId}`;

      if (!agrupado[chaveGrupo]) {
        agrupado[chaveGrupo] = {
          id: item.id,
          tipoId: {
            id: item.pacienteId, // Usando o pacienteId como um identificador temporário, ajuste conforme necessário
            nome: tipo,
          },
          faixaEtariaId: {
            id: item.pacienteId, // Usando o pacienteId como um identificador temporário, ajuste conforme necessário
            nome: faixaEtaria,
          },
          atividades: [],
          pacienteId: {
            id: item.pacienteId,
            nome: `Paciente ${item.pacienteId}`, // Ajuste o nome conforme a necessidade
          },
        };
      }

      agrupado[chaveGrupo].atividades.push({
        id: item.atividadeId,
        nome: item.atividade,
      });
    });

    return Object.values(agrupado);
  }

  async filter(body: any, page: number, pageSize: number) {
    const prisma = this.prismaService.getPrismaClient();

    switch (body.protocoloId) {
      case TIPO_PROTOCOLO_ENUM.portage:
        console.log('portage');

        const portage = await prisma.portage.findMany({
          select: {
            id: true,
            tipo: true,
            atividadeId: true,
            atividade: true,
            faixaEtaria: true,
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

        return this.groupedArray(portage);

      case TIPO_PROTOCOLO_ENUM.pei:
        const result = await prisma.pei.findMany({
          where: {
            pacienteId: body.pacienteId,
          },
        });

        console.log(result);

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
    const payload = [];

    // Passo 1: Montar o payload com os dados enviados
    await Promise.all(
      body.map((item: any) => {
        item.atividades.map((atividade: any) => {
          payload.push({
            atividade: atividade.nome,
            atividadeId: atividade.id,
            pacienteId: item.pacienteId.id,
            faixaEtaria: item.faixaEtariaId.nome,
            tipo: item.tipoId.nome,
          });
        });
      }),
    );

    try {
      // Passo 2: Buscar os registros existentes no banco de dados
      const registrosExistentes = await prisma.portage.findMany({
        where: { pacienteId: body[0].pacienteId.id }, // Ajuste conforme necessário
      });

      // Passo 3: Identificar os registros que precisam ser atualizados ou inseridos
      const registrosExistentesIds = registrosExistentes.map(
        (item) => item.atividadeId,
      );

      const novosRegistros = payload.filter(
        (item) => !registrosExistentesIds.includes(item.atividadeId),
      );
      const registrosParaAtualizar = payload.filter((item) =>
        registrosExistentesIds.includes(item.atividadeId),
      );

      // Passo 4: Atualizar os registros existentes, caso tenham mudado
      await Promise.all(
        registrosParaAtualizar.map(async (item) => {
          const registroExistente = registrosExistentes.find(
            (r) => r.atividadeId === item.atividadeId,
          );

          // Verificar se algum campo mudou
          if (
            registroExistente.atividade !== item.atividade ||
            registroExistente.faixaEtaria !== item.faixaEtaria ||
            registroExistente.tipo !== item.tipo
          ) {
            // Se mudou, atualiza o registro
            await prisma.portage.update({
              where: { id: registroExistente.id },
              data: {
                atividade: item.atividade,
                faixaEtaria: item.faixaEtaria,
                tipo: item.tipo,
              },
            });
          }
        }),
      );

      // Passo 5: Inserir novos registros
      if (novosRegistros.length > 0) {
        await prisma.portage.createMany({
          data: novosRegistros,
        });
      }

      // Passo 6: Excluir os registros que não estão mais presentes nos dados enviados
      const idsAtuais = payload.map((item) => item.atividadeId);
      const idsParaExcluir = registrosExistentes
        .filter((item) => !idsAtuais.includes(item.atividadeId))
        .map((item) => item.id);

      if (idsParaExcluir.length > 0) {
        await prisma.portage.deleteMany({
          where: {
            id: { in: idsParaExcluir },
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

  async dropdown() {
    return PORTAGE_LIST;
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
