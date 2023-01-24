import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PerfilProps, PerfilServiceInterface } from './perfil.interface';

@Injectable()
export class PerfilService implements PerfilServiceInterface {
  constructor(private readonly prismaService: PrismaService) {}

  async createPerfil(body: PerfilProps): Promise<PerfilProps> {
    return await this.prismaService.perfil.create({
      data: {
        nome: body.nome,
      },
    });
  }
  async updatePerfil(body: PerfilProps, id: number): Promise<PerfilProps> {
    return await this.prismaService.perfil.update({
      data: {
        nome: body.nome,
      },
      where: {
        id: Number(id),
      },
    });
  }
  async getPerfil(): Promise<PerfilProps[]> {
    return await this.prismaService.perfil.findMany({
      select: {
        id: true,
        nome: true,
      },
      where: {
        NOT: {
          nome: 'Developer',
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }
  async searchPerfil(word: string): Promise<PerfilProps[]> {
    return await this.prismaService.perfil.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: 'asc',
      },
      where: {
        OR: [
          {
            nome: {
              contains: word,
            },
          },
        ],
        NOT: {
          nome: 'Developer',
        },
      },
    });
  }
}
