import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GuiaAmilCreateDto,
  GuiaAmilListQuery,
  GuiaAmilUpdateDto,
} from './guia-amil.interface';
import { AmilClientService } from './amil-client.service';
import { guiaAmilMockResponse } from './guia-amil.mock';
import { GUIA_AMIL_STATUS } from './guia-amil';
import { buildPagination } from 'src/util/pagination';
import { buildTextSearchWhere } from 'src/util/search';

@Injectable()
export class GuiaAmilService {
  constructor(
    private readonly prismaService: PrismaService,
    @Optional() private readonly amilClientService?: AmilClientService,
  ) {}

  async create(body: GuiaAmilCreateDto) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return {
        ...guiaAmilMockResponse.create,
        ...body,
      };
    }

    const prisma = this.prismaService.getPrismaClient();

    return prisma.guiaAmil.create({
      data: {
        numeroGuia: body.numeroGuia || `GUIA-${Date.now()}`,
        tipoGuia: body.tipoGuia,
        pacienteId: body.pacienteId,
        sessaoId: body.sessaoId,
        prestadorId: body.prestadorId,
        dadosGuia: body.dadosGuia || {},
        valorTotal: body.valorTotal || 0,
        status: body.status || 'RASCUNHO',
      },
    });
  }

  async update(id: number, body: GuiaAmilUpdateDto) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return {
        id,
        numeroGuia: body.numeroGuia || 'GUIA-MOCK-UPDATED',
        tipoGuia: body.tipoGuia || 'CONSULTA',
        status: body.status || 'RASCUNHO',
        valorTotal: body.valorTotal || 0,
      };
    }

    const prisma = this.prismaService.getPrismaClient();

    return prisma.guiaAmil.update({
      where: { id },
      data: {
        ...(body.numeroGuia ? { numeroGuia: body.numeroGuia } : {}),
        ...(body.tipoGuia ? { tipoGuia: body.tipoGuia } : {}),
        ...(body.pacienteId ? { pacienteId: body.pacienteId } : {}),
        ...(body.sessaoId ? { sessaoId: body.sessaoId } : {}),
        ...(body.prestadorId ? { prestadorId: body.prestadorId } : {}),
        ...(body.dadosGuia ? { dadosGuia: body.dadosGuia } : {}),
        ...(body.valorTotal !== undefined
          ? { valorTotal: body.valorTotal }
          : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });
  }

  /**
   * Item 11 dos "pontos menores" (heron-list-web): esse endpoint tinha o
   * nome de "dropdown" (opções pra preencher os selects do formulário de
   * guia — status, origem) mas devolvia uma LISTAGEM de guias já
   * existentes (mesma coisa que `list()` já faz, redundante). O front
   * (server/index.ts: getAmilGuideDropdowns) espera
   * `{ status: [{id,nome}], origens: [{id,nome}] }` — como nunca batia
   * com nenhum campo do payload real, o front sempre caía no fallback de
   * reconstruir as opções a partir da própria listagem de guias.
   *
   * status vem de GUIA_AMIL_STATUS (guia-amil.ts, único catálogo real de
   * status válidos pra GuiaAmil já existente no código). "origens" não é
   * um conceito de GuiaAmil (é de LoteGuia.origem, que só é usado como
   * 'MANUAL' — não achei nenhum outro valor gerado em nenhum lugar do
   * backend) — devolvido com essa única opção conhecida, pra não
   * inventar valores que não existem.
   */
  dropdown() {
    return {
      status: Object.values(GUIA_AMIL_STATUS).map((status) => ({
        id: status,
        nome: status,
      })),
      origens: [{ id: 'MANUAL', nome: 'Manual' }],
    };
  }

  private buildListWhere(query: GuiaAmilListQuery) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.numeroGuia || query.paciente) {
      const textSearchWhere = buildTextSearchWhere(
        query.numeroGuia || query.paciente || '',
        ['numeroGuia', 'paciente.nome'],
      );

      return {
        ...where,
        ...textSearchWhere,
      };
    }

    return where;
  }

  async list(query: GuiaAmilListQuery) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return guiaAmilMockResponse.list;
    }

    const prisma = this.prismaService.getPrismaClient();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const [data, totalItems] = await Promise.all([
      prisma.guiaAmil.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          paciente: { select: { id: true, nome: true } },
          sessao: { select: { id: true } },
        },
      }),
      prisma.guiaAmil.count({ where }),
    ]);

    return {
      data,
      pagination: buildPagination(page, limit, totalItems),
    };
  }

  async findOne(id: number) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return {
        id,
        numeroGuia: 'GUIA-MOCK-001',
        tipoGuia: 'CONSULTA',
        status: 'RASCUNHO',
        valorTotal: 150,
        paciente: { id: 1, nome: 'Paciente Mock' },
        sessao: { id: 10 },
        loteGuiaItems: [],
        historico: guiaAmilMockResponse.historico,
      };
    }

    const prisma = this.prismaService.getPrismaClient();
    return prisma.guiaAmil.findUnique({
      where: { id },
      include: {
        paciente: { select: { id: true, nome: true } },
        sessao: { select: { id: true } },
        loteGuiaItems: true,
        historico: true,
      },
    });
  }

  async testarConexao() {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return {
        sucesso: true,
        mock: true,
        mensagem: 'Conexão simulada com a Amil configurada com sucesso',
      };
    }

    if (!this.amilClientService) {
      return {
        sucesso: false,
        mock: false,
        mensagem: 'Cliente Amil não configurado',
      };
    }

    const resposta = await this.amilClientService.consultarProtocolo(
      'mock-protocolo',
    );

    return {
      sucesso: resposta.sucesso,
      mock: false,
      mensagem: resposta.sucesso
        ? 'Conexão com a Amil realizada com sucesso'
        : resposta.mensagemErro || 'Falha ao conectar com a Amil',
      statusHttp: resposta.statusHttp,
      detalhes: resposta,
    };
  }

  async prepararEnvio(id: number, usuario: any) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return {
        id,
        status: 'PRONTA_PARA_ENVIO',
        prontoParaEnvioEm: new Date().toISOString(),
      };
    }

    const prisma = this.prismaService.getPrismaClient();
    return prisma.guiaAmil.update({
      where: { id },
      data: {
        status: 'PRONTA_PARA_ENVIO',
        prontoParaEnvioEm: new Date(),
      },
    });
  }

  private gerarXmlGuia(guia: any) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<GuiaAmil>
  <numeroGuia>${guia.numeroGuia}</numeroGuia>
  <tipoGuia>${guia.tipoGuia}</tipoGuia>
  <pacienteId>${guia.pacienteId}</pacienteId>
  <valorTotal>${guia.valorTotal || 0}</valorTotal>
</GuiaAmil>`;
  }

  private validarXml(xml: string) {
    return (
      typeof xml === 'string' &&
      xml.includes('<GuiaAmil>') &&
      xml.includes('</GuiaAmil>')
    );
  }

  async enviarGuia(id: number, usuario: any) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return {
        guiaId: id,
        loteId: guiaAmilMockResponse.lote.id,
        sucesso: true,
        mensagem: 'Mock de envio realizado com sucesso',
      };
    }

    const prisma = this.prismaService.getPrismaClient();
    const guia = await prisma.guiaAmil.findUnique({ where: { id } });

    if (!guia) throw new Error('Guia não encontrada');

    const lote = await prisma.loteGuia.create({
      data: {
        origem: 'MANUAL',
        status: 'VALIDANDO',
        quantidadeGuias: 1,
        idempotencyKey: `guia-${id}-${Date.now()}`,
      },
    });

    await prisma.loteGuiaItem.create({
      data: {
        loteId: lote.id,
        guiaId: guia.id,
        status: 'AGUARDANDO_LOTE',
      },
    });

    await prisma.guiaAmil.update({
      where: { id },
      data: {
        status: 'VALIDANDO',
        loteId: lote.id,
      },
    });

    const xml = this.gerarXmlGuia(guia);
    const valido = this.validarXml(xml);

    if (!valido) {
      await prisma.loteGuia.update({
        where: { id: lote.id },
        data: { status: 'INVALIDO' },
      });
      await prisma.guiaAmil.update({
        where: { id },
        data: { status: 'ERRO_VALIDACAO' },
      });
      throw new Error('XML inválido');
    }

    const resposta = this.amilClientService
      ? await this.amilClientService.enviarLote(xml, lote.idempotencyKey || '')
      : {
          sucesso: false,
          codigoErro: 'CLIENT_NOT_INJECTED',
          mensagemErro: 'Cliente Amil não configurado',
          statusHttp: 0,
          xmlRetorno: '',
        };

    await prisma.transacaoAmil.create({
      data: {
        loteId: lote.id,
        tipo: 'ENVIO_LOTE',
        statusHttp: resposta.statusHttp,
        sucesso: resposta.sucesso,
        codigoErro: resposta.codigoErro,
        mensagemErro: resposta.mensagemErro,
        xmlEnvio: xml,
        xmlRetorno: resposta.xmlRetorno,
      },
    });

    await prisma.loteGuia.update({
      where: { id: lote.id },
      data: {
        status: resposta.sucesso ? 'COM_PROTOCOLO' : 'ERRO_COMUNICACAO',
        xmlEnvio: xml,
        xmlRetorno: resposta.xmlRetorno,
        enviadoEm: new Date(),
      },
    });

    await prisma.guiaAmil.update({
      where: { id },
      data: {
        status: resposta.sucesso ? 'ENVIADA' : 'ERRO_COMUNICACAO',
        enviadoEm: resposta.sucesso ? new Date() : null,
      },
    });

    return { guiaId: guia.id, loteId: lote.id, sucesso: resposta.sucesso };
  }

  async historico(id: number) {
    if (process.env.AMIL_MOCK_MODE === 'true') {
      return guiaAmilMockResponse.historico;
    }

    const prisma = this.prismaService.getPrismaClient();
    return prisma.guiaAmilHistorico.findMany({
      where: { guiaId: id },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criarLote(guiaIds: number[], origem = 'MANUAL', usuarioId?: number) {
    const prisma = this.prismaService.getPrismaClient();

    const lote = await prisma.loteGuia.create({
      data: {
        origem,
        status: 'CRIADO',
        quantidadeGuias: guiaIds.length,
        idempotencyKey: `lote-${Date.now()}`,
      },
    });

    await Promise.all(
      guiaIds.map((guiaId) =>
        prisma.loteGuiaItem.create({
          data: {
            loteId: lote.id,
            guiaId,
            status: 'AGUARDANDO_LOTE',
          },
        }),
      ),
    );

    await prisma.guiaAmil.updateMany({
      where: { id: { in: guiaIds } },
      data: { status: 'AGUARDANDO_LOTE', loteId: lote.id },
    });

    return lote;
  }

  async findOneLote(id: number) {
    const prisma = this.prismaService.getPrismaClient();
    return prisma.loteGuia.findUnique({
      where: { id },
      include: {
        itens: true,
        transacoes: true,
      },
    });
  }

  async consultarLote(id: number) {
    const prisma = this.prismaService.getPrismaClient();
    return prisma.loteGuia.update({
      where: { id },
      data: { status: 'COM_PROTOCOLO', consultadoEm: new Date() },
    });
  }

  async reprocessarLote(id: number) {
    const prisma = this.prismaService.getPrismaClient();
    return prisma.loteGuia.update({
      where: { id },
      data: { status: 'CRIADO' },
    });
  }
}
