import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GuiaAmilCreateDto, GuiaAmilListQuery, GuiaAmilUpdateDto } from './guia-amil.interface';

@Injectable()
export class GuiaAmilService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: GuiaAmilCreateDto) {
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
        ...(body.valorTotal !== undefined ? { valorTotal: body.valorTotal } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });
  }

  async list(query: GuiaAmilListQuery) {
    const prisma = this.prismaService.getPrismaClient();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.numeroGuia) where.numeroGuia = { contains: query.numeroGuia };
    if (query.paciente) where.paciente = { nome: { contains: query.paciente } };

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
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }

  async findOne(id: number) {
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

  async prepararEnvio(id: number, usuario: any) {
    const prisma = this.prismaService.getPrismaClient();
    return prisma.guiaAmil.update({
      where: { id },
      data: {
        status: 'PRONTA_PARA_ENVIO',
        prontoParaEnvioEm: new Date(),
      },
    });
  }

  async enviarGuia(id: number, usuario: any) {
    const prisma = this.prismaService.getPrismaClient();
    const guia = await prisma.guiaAmil.findUnique({ where: { id } });

    if (!guia) throw new Error('Guia não encontrada');

    const lote = await prisma.loteGuia.create({
      data: {
        origem: 'MANUAL',
        status: 'CRIADO',
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
        status: 'AGUARDANDO_LOTE',
        loteId: lote.id,
      },
    });

    return { guiaId: guia.id, loteId: lote.id };
  }

  async historico(id: number) {
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
