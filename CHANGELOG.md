
3º Entrega
- Implementa Manutenção (tela Meta-dtt/ tela sessão)
- Folha de primeira respsta estava considerando a data de criacao da sessão e não a data de inicio da sessão como data principal

2º Entrega
- Implementa o processo de ensino dinamicamente no PEI
- Ajusta agenda
- Ajusta aegnda ao salvar sessão


1º Entrega
- Implementa Folha de Primeira Resposta
- Implementa PEI
- Inclui Resumo de sessão
- mudar rota /usuarios/terapeutas para /terapeuta/dropdown


[0.10.0-beta.0]

O que foi corrigido
Ajuste no fluxo financeiro para evitar que eventos incompletos interrompessem a geração do relatório.
Melhorias no tratamento de dados ausentes, como frequência vazia, falta de intervalo e relações de vaga incompletas.
Correção no filtro de pacientes para que a busca continue funcionando mesmo sem critérios completos de vaga.
Ajuste no fluxo de atualização de paciente para evitar erro do Prisma quando vagaId vinha nulo ou inexistente.
🔧 Pontos principais alterados
financeiro.service.ts

Tornou o processamento mais tolerante a eventos sem dados completos.
Evitou que o relatório fosse descartado por problemas de expansão de recorrência.
paciente.service.ts

Ajustou o filtro para não depender exclusivamente de uma vaga preenchida.
Corrigiu a atualização de paciente para resolver ou criar a vaga antes de alterar as especialidades.
Eliminou a possibilidade de passar vagaId: null para o Prisma.
paciente.service.spec.ts

Adicionados testes de regressão para cobrir:
filtro de pacientes sem critérios de vaga,
atualização de paciente sem vagaId.
