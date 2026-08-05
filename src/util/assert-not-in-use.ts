// R20: exclusão de cadastro auxiliar (Especialidade/Função/Localidade/
// StatusEventos) fazia hard delete direto — se a linha estivesse referenciada
// em outra tabela, o Prisma rejeitava com um erro cru de FK (500 genérico,
// mensagem incompreensível pro usuário). Este helper checa antes se a
// entidade está em uso em algum dos relacionamentos informados e, se
// estiver, lança um erro com mensagem clara em vez de deixar a constraint
// do banco estourar.
export async function assertEntidadeNaoEstaEmUso(
  prisma: any,
  checks: Array<{ model: string; where: Record<string, any> }>,
  mensagem: string,
) {
  const counts = await Promise.all(
    checks.map(({ model, where }) => prisma[model].count({ where })),
  );

  if (counts.some((count: number) => count > 0)) {
    throw new Error(mensagem);
  }
}
