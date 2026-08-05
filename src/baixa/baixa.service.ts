import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaixaCreateProps, BaixaFilterProps } from './baixa.interface';
import {
  calcHoursHHMM,
  dateFormatDDMMYYYY,
  dateFormatDDMMYYYYHHMM,
} from 'src/util/format-date';
import { buildPagination } from 'src/util/pagination';
import { buildQueryFilter } from 'src/util/filters';
import { UserService } from 'src/user/user.service';

@Injectable()
export class BaixaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async getAll(page: number, pageSize: number, query?: any) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const filter = buildQueryFilter(
      !query || typeof query !== 'object' ? ({} as any) : query,
    );

    const [result, totalItems] = await Promise.all([
      prisma.baixa.findMany({
        select: {
          id: true,
          paciente: {
            select: {
              carteirinha: true,
              nome: true,
              convenio: true,
            },
          },
          terapeuta: {
            select: {
              usuario: {
                select: {
                  nome: true,
                },
              },
            },
          },
          localidade: true,
          status: true,
          usuario: true,
          baixa: true,
          updatedAt: true,
          dataEvento: true,
          evento: {
            select: {
              start: true,
              end: true,
              especialidade: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        where: {
          ...filter,
        },
        skip,
        take: pageSize,
      }),
      prisma.baixa.count({ where: filter }),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize);

    const data = await Promise.all(
      result.map((item: any) => {
        const updatedAt = Boolean(item.updatedAt) ? item.updatedAt : '-';
        const paciente = item.paciente || {};
        const terapeuta = item.terapeuta?.usuario || {};
        const localidade = item.localidade || {};
        const evento = item.evento || {};
        const status = item.status || {};
        const convenio = paciente.convenio || {};

        const dataEvento = item.dataEvento
          ? dateFormatDDMMYYYY(item.dataEvento)
          : '-';
        const cargaHoraria =
          evento.start && evento.end
            ? calcHoursHHMM(evento.start, evento.end)
            : '-';

        return {
          id: item.id,
          paciente: paciente.nome || '-',
          carteirinha: paciente.carteirinha || '-',
          terapeuta: terapeuta.nome || '-',
          localidade: localidade.casa || '-',
          convenio: convenio.nome || '-',
          status: status.nome || '-',
          usuario: item.baixa ? item.usuario?.nome || '-' : '-',
          baixa: item.baixa,
          dataBaixa:
            item.baixa && updatedAt !== '-'
              ? dateFormatDDMMYYYYHHMM(updatedAt)
              : '-',
          dataEvento,
          cargaHoraria,
          especialidade: evento.especialidade?.nome || '-',
        };
      }),
    );

    const pagination = buildPagination(page, pageSize, totalItems);

    return { data, pagination };
  }

  async update({ id }: BaixaFilterProps, login?: string) {
    const prisma = this.prismaService.getPrismaClient();

    // usuarioId nunca vem do corpo da requisição: é sempre resolvido a
    // partir do usuário autenticado (JWT), para que o registro de quem deu
    // baixa não possa ser forjado pelo cliente.
    const usuario = login ? await this.userService.getUser(login) : null;

    return await prisma.baixa.update({
      data: {
        baixa: true,
        usuarioId: usuario?.id,
      },
      where: {
        id: Number(id),
      },
    });
  }

  async create(data: BaixaCreateProps) {
    const prisma = this.prismaService.getPrismaClient();

    const existentes = await prisma.baixa.findMany({
      where: {
        eventoId: data.eventoId,
      },
    });

    if (existentes.length) {
      // Antes retornava `undefined` sem log nenhum — quem chamasse não
      // tinha como saber se a baixa foi criada ou se já existia. Isso é
      // esperado ao reeditar um evento que já gerou baixa (efeito colateral
      // idempotente), então não lança erro — mas fica visível no log e no
      // retorno, em vez de silencioso.
      console.warn(
        `Baixa já existe para o evento ${data.eventoId}, criação ignorada.`,
      );
      return { created: false, duplicate: true, baixa: existentes[0] };
    }

    const baixa = await prisma.baixa.create({
      data: {
        ...data,
      },
    });

    return { created: true, duplicate: false, baixa };
  }

  async delete(id: number) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      return await prisma.baixa.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
