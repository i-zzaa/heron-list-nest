import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PORTAGE_FAIXA_ETARIA,
  PORTAGE_LIST,
  PORTAGE_TIPO,
  TIPO_PROTOCOLO,
} from './protocolo';

@Injectable()
export class ProtocoloService {
  constructor(private readonly prismaService: PrismaService) {}

  async createPostage(body: any, terapeutaId: number) {
    const prisma = this.prismaService.getPrismaClient();

    const payload = [];
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

    console.log(payload);

    try {
      await prisma.portage.createMany({
        data: [...payload],
      });
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
