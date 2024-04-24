import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { BaixaCreateProps, BaixaFilterProps } from './baixa.interface';
import {
  dateFormatDDMMYYYY,
  dateFormatDDMMYYYYHHMM,
} from 'src/util/format-date';

@Injectable()
export class BaixaService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number, query?: any) {
    const prisma = this.prismaService.getPrismaClient();

    const skip = (page - 1) * pageSize;

    const filter: any = {};
    Object.keys(query).map((key: string) => {
      switch (key) {
        case 'baixa':
          filter[key] = query[key];
          break;
        case 'convenioId':
          filter.paciente = {
            convenio: {
              id: query.convenioId,
            },
          };

          delete query.convenioId;
          break;

        default:
          filter[key] = Number(query[key]);
          break;
      }
    });

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
      prisma.baixa.count(),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize);

    const data = await Promise.all(
      result.map((item) => {
        const updatedAt = Boolean(item.updatedAt) ? item.updatedAt : '-';

        return {
          id: item.id,
          paciente: item.paciente.nome,
          carteirinha: item.paciente.carteirinha,
          terapeuta: item.terapeuta.usuario.nome,
          localidade: item.localidade.casa,
          convenio: item.paciente.convenio.nome,
          status: item.status.nome,
          usuario: item.usuario?.nome || '-',
          baixa: item.baixa,
          dataBaixa: dateFormatDDMMYYYYHHMM(updatedAt),
          dataEvento: dateFormatDDMMYYYY(item.dataEvento),
        };
      }),
    );

    const pagination = {
      currentPage: page,
      pageSize,
      totalPages,
    };

    return { data, pagination };
  }

  async update({ id, usuarioId }: BaixaFilterProps) {
    const prisma = this.prismaService.getPrismaClient();

    return await prisma.baixa.update({
      data: {
        baixa: true,
        usuarioId: usuarioId,
      },
      where: {
        id: Number(id),
      },
    });
  }

  async create(data: BaixaCreateProps) {
    const prisma = this.prismaService.getPrismaClient();

    try {
      const [usuario, evento] = await Promise.all([
        prisma.usuario.findUnique({
          where: { login: data.usuarioLogin },
        }),
        prisma.baixa.findMany({
          where: {
            eventoId: data.eventoId,
          },
        }),
      ]);

      if (Boolean(evento.length)) return;

      delete data.usuarioLogin;
      return await prisma.baixa.create({
        data: {
          ...data,
          usuarioId: usuario.id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
