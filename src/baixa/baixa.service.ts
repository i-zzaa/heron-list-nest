import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { BaixaCreateProps, BaixaFilterProps } from './baixa.interface';
import { dateFormatDDMMYYYY } from 'src/util/format-date';

@Injectable()
export class BaixaService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(page: number, pageSize: number, query?: any) {
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
      this.prismaService.baixa.findMany({
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
      this.prismaService.statusEventos.count(),
    ]);
    const totalPages = Math.ceil(totalItems / pageSize);

    const data = await Promise.all(
      result.map((item) => {
        const updatedAt = Boolean(item.usuario) ? item.updatedAt : '-';
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
          dataBaixa: dateFormatDDMMYYYY(updatedAt),
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
    return await this.prismaService.baixa.update({
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
    try {
      return await this.prismaService.baixa.create({
        data: {
          ...data,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
