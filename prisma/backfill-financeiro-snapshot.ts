/**
 * Backfill único (R17): popula o snapshot financeiro (valorSessaoSnapshot,
 * comissaoSnapshot, tipoComissaoSnapshot, valorPorKmSnapshot,
 * valorSessaoDevolutivaSnapshot) dos registros de `Calendario` que já
 * existiam antes dessas colunas — usando o melhor valor disponível hoje (o
 * atual do cadastro), já que não existe um valor "histórico" real para
 * essas linhas. Dali em diante, `AgendaService` grava o snapshot na
 * criação/edição de cada evento; este script não precisa rodar de novo por
 * causa disso (idempotente: só toca linha com snapshot ainda nulo).
 *
 * Rodar com: npx ts-node prisma/backfill-financeiro-snapshot.ts
 */
import { PrismaClient } from '@prisma/client';
import { VALOR_POR_KM, VALOR_SESSAO_DEVOLUTIVA } from '../src/util/financeiro-config';

const prisma = new PrismaClient();

async function main() {
  const pendentes = await prisma.calendario.findMany({
    where: {
      OR: [
        { valorSessaoSnapshot: null },
        { comissaoSnapshot: null },
        { valorPorKmSnapshot: null },
        { valorSessaoDevolutivaSnapshot: null },
      ],
    },
    select: {
      id: true,
      pacienteId: true,
      especialidadeId: true,
      terapeutaId: true,
      funcaoId: true,
    },
  });

  console.log(`${pendentes.length} evento(s) sem snapshot financeiro.`);

  let atualizados = 0;

  for (const evento of pendentes) {
    const vaga = await prisma.vaga.findUnique({
      select: { id: true },
      where: { pacienteId: evento.pacienteId },
    });

    const vagaOnEspecialidade = vaga
      ? await prisma.vagaOnEspecialidade.findUnique({
          where: {
            vagaId_especialidadeId: {
              vagaId: vaga.id,
              especialidadeId: evento.especialidadeId,
            },
          },
        })
      : null;

    const comissao = await prisma.terapeutaOnFuncao.findUnique({
      where: {
        terapeutaId_funcaoId: {
          terapeutaId: evento.terapeutaId,
          funcaoId: evento.funcaoId,
        },
      },
    });

    await prisma.calendario.update({
      where: { id: evento.id },
      data: {
        valorSessaoSnapshot: vagaOnEspecialidade?.valor ?? null,
        comissaoSnapshot: comissao?.comissao ?? null,
        tipoComissaoSnapshot: comissao?.tipo ?? null,
        valorPorKmSnapshot: VALOR_POR_KM,
        valorSessaoDevolutivaSnapshot: VALOR_SESSAO_DEVOLUTIVA,
      },
    });

    atualizados += 1;
  }

  console.log(`${atualizados} evento(s) atualizados com snapshot financeiro.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
