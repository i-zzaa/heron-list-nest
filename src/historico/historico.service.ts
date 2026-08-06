import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaClient } from 'src/util/crud';

// Campos que nunca fazem sentido num diff de auditoria — timestamps
// técnicos e relações completas (se algum snapshot vier com elas
// incluídas por engano, não polui o histórico).
const CAMPOS_IGNORADOS = new Set([
  'createdAt',
  'updatedAt',
  'updateAt', // typo existente no schema (Paciente.updateAt)
]);

@Injectable()
export class HistoricoService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Calcula a diferença entre dois objetos planos (só campos escalares —
   * não espera relação aninhada). Retorna só os campos que mudaram, com
   * o valor antigo e o novo lado a lado.
   */
  private calcularDiff(antes: Record<string, any>, depois: Record<string, any>) {
    const diffAntes: Record<string, any> = {};
    const diffDepois: Record<string, any> = {};

    const chaves = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);

    chaves.forEach((chave) => {
      if (CAMPOS_IGNORADOS.has(chave)) {
        return;
      }

      const valorAntes = antes?.[chave];
      const valorDepois = depois?.[chave];

      // Decimal do Prisma e Date não comparam bem com !==; string() cobre
      // os dois casos usados aqui (campos escalares de Paciente/Calendario).
      const iguais = String(valorAntes ?? '') === String(valorDepois ?? '');

      if (!iguais) {
        diffAntes[chave] = valorAntes ?? null;
        diffDepois[chave] = valorDepois ?? null;
      }
    });

    return { diffAntes, diffDepois };
  }

  /**
   * `tx`, quando informado, é o client transacional de um
   * `prisma.$transaction(async (tx) => ...)` já em andamento no chamador —
   * mantém o registro de histórico atômico junto com a mudança real (não
   * é fire-and-forget: se o histórico falhar, a transação inteira desfaz,
   * mesmo critério já usado em BaixaExclusaoLog).
   */
  async registrarCriacao(
    entidade: string,
    entidadeId: number,
    depois: Record<string, any>,
    usuarioLogin?: string,
    tx?: any,
  ) {
    await this.gravar(
      { entidade, entidadeId, acao: 'criacao', antes: undefined, depois, usuarioLogin },
      tx,
    );
  }

  async registrarEdicao(
    entidade: string,
    entidadeId: number,
    antes: Record<string, any>,
    depois: Record<string, any>,
    usuarioLogin?: string,
    tx?: any,
  ) {
    const { diffAntes, diffDepois } = this.calcularDiff(antes, depois);

    if (!Object.keys(diffDepois).length) {
      return; // nada mudou de fato — não grava linha vazia
    }

    await this.gravar(
      { entidade, entidadeId, acao: 'edicao', antes: diffAntes, depois: diffDepois, usuarioLogin },
      tx,
    );
  }

  async registrarExclusao(
    entidade: string,
    entidadeId: number,
    antes: Record<string, any>,
    usuarioLogin?: string,
    tx?: any,
  ) {
    await this.gravar(
      { entidade, entidadeId, acao: 'exclusao', antes, depois: undefined, usuarioLogin },
      tx,
    );
  }

  private async gravar(
    dados: {
      entidade: string;
      entidadeId: number;
      acao: string;
      antes?: Record<string, any>;
      depois?: Record<string, any>;
      usuarioLogin?: string;
    },
    tx?: any,
  ) {
    const prisma = tx || getPrismaClient(this.prismaService);

    await prisma.historicoAlteracao.create({
      data: {
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        acao: dados.acao,
        antes: dados.antes ?? undefined,
        depois: dados.depois ?? undefined,
        usuarioLogin: dados.usuarioLogin,
      },
    });
  }

  async listar(entidade: string, entidadeId: number) {
    const prisma = getPrismaClient(this.prismaService);

    return prisma.historicoAlteracao.findMany({
      where: { entidade, entidadeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
