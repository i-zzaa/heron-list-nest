# Auditoria do Backend — Regras de Negócio MultiAlcance

**Repositório:** `heron-list-nest` (branch `featureGuiaAmil`) · **Escopo:** diagnóstico completo + três rodadas de correções (ver §9: rodada 1 = bugs mecânicos de baixo risco; rodada 2 = identidade, conflito de agenda/jornada/vínculos, campos bloqueados, recorrência, antecedência de cancelamento e proteção de evento passado; rodada 3 = CORS, migration financeira para `Decimal`, correção do 404 de rota, tratamento de erro real, feriados dinâmicos, seed de cadastros e monitoramento).
**Data:** 2026-08-04 (atualizado em 2026-08-05)

---

## Sumário

1. [Resumo executivo](#1-resumo-executivo)
2. [Arquitetura encontrada](#2-arquitetura-encontrada)
3. [Matriz de conformidade](#3-matriz-de-conformidade)
4. [Problemas encontrados](#4-problemas-encontrados)
5. [Regras somente no frontend](#5-regras-somente-no-frontend)
6. [Endpoints encontrados (amostra)](#6-endpoints-encontrados-amostra)
7. [Modelo de dados](#7-modelo-de-dados)
8. [Testes](#8-testes)
9. [Ajustes já aplicados nesta sessão](#9-ajustes-já-aplicados-nesta-sessão)
10. [Plano de correção (etapas restantes)](#10-plano-de-correção-etapas-restantes)
11. [Decisões de negócio pendentes](#11-decisões-de-negócio-pendentes)

---

## 1. Resumo executivo

**Percentual estimado de atendimento às regras descritas: ~25–30%.** A maior parte dos cadastros e do fluxo de agenda/filas existe e roda, mas quase todas as regras de **integridade, autorização e integridade financeira** descritas no enunciado são aplicadas apenas no frontend ou não existem no backend.

> **Correção em relação à primeira versão deste relatório:** a regra "terapeuta só possui uma especialidade" **é intencional**, não é uma falha. O modelo `Terapeuta.especialidadeId` (FK única) está correto. O que a terapeuta pode ter em quantidade é **função** dentro dessa especialidade — e isso já está modelado corretamente via `TerapeutaOnFuncao` (N:N entre terapeuta e função, com comissão por função). O item antigo "R23 — terapeuta com só 1 especialidade" foi **removido da lista de problemas**.

| Módulo | Situação |
|---|---|
| Autenticação/Autorização | ⚠️ Parcial — identidade via JWT verificado (corrigido); `VagaController` sem guard (corrigido); **autorização por tag agora implementada nas rotas de maior risco** (usuários, grupo-permissão, baixa, exclusão de paciente — corrigido, rodada 4). Demais rotas (agenda, outros cadastros) seguem só com `AuthGuard('jwt')`, sem tag |
| Cadastro de terapeuta (jornada, comissão, especialidade/funções) | ⚠️ Parcial — 1 especialidade + N funções está correto; jornada 8h–20h/sem sobreposição agora é validada no agendamento (corrigido) |
| Paciente | ⚠️ Parcial — sem dedupe de carteirinha, sem snapshot financeiro; `delete()` apagava a entidade errada (corrigido) |
| Filas (avaliação/devolutiva/terapia) | ⚠️ Parcial — máquina de estados via `Vaga`; `switch` com fallthrough corrigido; **transação real (`$transaction`) entre vaga↔paciente ainda não implementada** |
| Agenda | ✅ Conflito de horário, jornada e vínculo especialidade/terapeuta/função agora validados na criação e edição; evento passado agora bloqueia edição de campos (só status) e exclusão |
| Edição "esta e as próximas" | ✅ Corrigido — `changeAll` agora sempre passa pelo split correto (série antiga trunca, série nova nasce da data atual); campos travados (modalidade/data/horário/frequência/intervalo/dias) são sempre mantidos do original |
| Cancelamento com/sem antecedência | ✅ Corrigido — backend decide sozinho (48h corridas até o início do evento), ignorando o status enviado pelo cliente quando for um dos dois de cancelamento |
| Baixa | ⚠️ Parcial — evita baixa duplicada (agora sinalizada, não mais silenciosa), `usuarioId` vem do JWT; exclusão continua física, sem motivo/auditoria |
| Financeiro | ⚠️ Parcial — valores agora `Decimal` no banco (corrigido, incl. dado real migrado), km/devolutiva configuráveis por env var (corrigido); **ainda sem snapshot** — relatório de período fechado muda se o cadastro mudar depois |
| CRUD de cadastros (13 controllers) | ✅ Corrigido — endpoints `DELETE /:id` estavam todos quebrados por bug de binding do NestJS |
| Tratamento de erro (`responseError`) | ✅ Corrigido — status e mensagem reais por tipo de erro (HttpException/Prisma/Error/string), nunca mais 401 fixo pra tudo, nunca vaza stack trace |
| Rota `/especialidade` (e prefixo `/api`) | ✅ Corrigido — faltava `setGlobalPrefix('api')` e o endpoint `GET` paginado inteiro não existia nesse controller |
| Monitoramento | ✅ Novo — log estruturado de toda requisição/erro (interceptor + filtro globais) |
| Testes | ⚠️ Melhorou, ainda insuficiente — 73 testes (31 originais + 42 novos entre as quatro rodadas desta sessão); segue sem e2e, sem teste de fila/financeiro/concorrência |
| Migrations/Seeds | ⚠️ Parcial — seed de 18 tabelas de cadastro criado nesta sessão (real, exclui PII/agendamento/filas); ainda sem histórico de migrations (`prisma migrate`) |
| Multiclínica | ❌ Não existe (não há `Clinica`/tenant em nenhuma entidade) |

### Riscos críticos (bloqueadores de produção)

1. ~~**Escalada de privilégio**: qualquer usuário autenticado podia criar/editar usuários, grupos de permissão e resetar a senha de qualquer conta~~ — **corrigido**: `PermissionsGuard` + tags reais do banco (`CADASTRO_USUARIOS_*`, `CADASTRO_GRUPO_PERMISSOES_*`) agora exigidas nessas rotas. **Ressalva**: a senha resetada continua sendo sempre `'12345678'` (previsível) para quem *tem* a permissão — isso não mudou. E os grupos `RECEPCAO`/`RECEPCAO BASICO` têm hoje as mesmas tags perigosas que `ADM` no banco real (dado, não bug de código — ver §9 rodada 4).
2. ~~**Identidade de negócio via header HTTP livre** (`req.headers.login`)~~ — **corrigido**: `agenda`, `usuarios`, `sessao` e `baixa` agora usam `req.user.username`, populado pelo payload assinado do JWT (`AuthGuard('jwt')`), não mais um header que o cliente controla.
3. ~~**`VagaController` sem autenticação nenhuma**~~ — **corrigido** (guard reativado). Antes da correção, qualquer pessoa na internet, sem token, conseguia mover pacientes entre filas.
4. ~~**Nenhuma verificação de conflito de horário** ao criar/editar eventos~~ — **corrigido**: dupla marcação, sobreposição parcial e evento fora da jornada (8h–20h ou fora do dia cadastrado) agora são rejeitados na criação e em toda edição que troca a terapeuta.
5. ~~**Bug de exclusão cruzada**: `PacienteService.delete()` deletava um registro de `Localidade`, não o paciente~~ — **corrigido**.
6. ~~**Todos os 13 endpoints `DELETE /:id` de cadastro**~~ — **corrigido**.
7. **Ausência de transação real (`prisma.$transaction`) nos fluxos de fila** (`VagaService.update`) — **não corrigido**: o `switch` sem `break` foi corrigido, mas as chamadas continuam em `Promise.all` (concorrência, não atomicidade). Fica para uma rodada dedicada por exigir threading do client de transação por várias camadas de service (Vaga → Paciente).
8. ~~**Financeiro sem precisão decimal / valores em `String`**~~ — **corrigido**: `VagaOnEspecialidade.valor`/`.km`, `TerapeutaOnFuncao.comissao`, `Calendario.km` migrados para `Decimal(10,2)` no banco real (dados existentes normalizados antes, sem perda). **Ainda sem snapshot** — o cálculo continua lendo o valor *atual* do cadastro, então alterar um valor/comissão hoje ainda reescreve relatórios de períodos fechados; isso não foi corrigido (exigiria guardar o valor no momento do evento/baixa).
9. ~~**"Esta e as próximas" reescrevia ocorrências passadas**~~ — **corrigido**: `changeAll` agora sempre passa pela lógica de split (trunca a série antiga, cria a nova a partir da data atual) em vez de um `updateMany` cru por `groupId`.
10. ~~**Campos bloqueados (modalidade/data/horário/frequência/intervalo/dias) eram graváveis via update**~~ — **corrigido**: sempre mantidos do registro original, ignorados silenciosamente se vierem diferentes no payload.
11. ~~**Cliente escolhia livremente entre "Cancelado com Antecedência" e "Cancelado sem Antecedência"**~~ — **corrigido**: backend recalcula com base em 48h corridas até o início do evento.
12. ~~**Evento passado podia ser editado/excluído livremente**~~ — **corrigido**: exclusão bloqueada; edição só aceita status = Atestado, com tolerância de 2h após o término (para não quebrar o check-in mobile).
13. ~~**`responseError` sempre 401 pra tudo**~~ — **corrigido**: status e mensagem reais por tipo de erro.
14. ~~**`GET /especialidade` (e toda rota, na real) respondendo 404**~~ — **corrigido**: faltava `setGlobalPrefix('api')` e faltava o endpoint `getAll` inteiro em `EspecialidadeController`.
15. ~~**`Baixa.create` silenciosa em duplicidade**~~ — **corrigido**: agora loga e sinaliza no retorno.
16. ~~**`perfilId` sem validação**~~ — **corrigido**: valida contra a tabela `Perfil`.
17. ~~**Sem seed**~~ — **parcialmente corrigido**: seed de 18 tabelas de cadastro real criado (`prisma/seed.ts`), PII e agendamento/filas excluídos por decisão própria (ver §11).
18. ~~**Sem log estruturado / monitoramento**~~ — **corrigido**: interceptor + filtro globais logam toda requisição e erro.

---

## 2. Arquitetura encontrada

- **Framework:** NestJS 9, TypeScript 4.7, sem `strictNullChecks`/`noImplicitAny`.
- **ORM:** Prisma 4.9 (`prisma/schema.prisma`).
- **Banco:** MySQL.
- **Autenticação:** Passport (`passport-local` no login, `passport-jwt` nas rotas) + `express-session`/`passport.session()` coexistindo com JWT stateless sem necessidade aparente.
- **Autorização:** inexistente além de "token válido" — sem guard de tags/permissão.
- **Padrão arquitetural:** Controller → Service → Prisma direto, sem repository, sem DTOs de classe validados (`*.interface.ts` são apenas `interface`/`enum`, não `class` com `class-validator`); `ValidationPipe` global está registrado mas não tem o que validar.
- **Migrations:** ainda não existem (`prisma/migrations/` ausente); schema aplicado via `db push`.
- **Seeds:** criado nesta sessão — [prisma/seed.ts](prisma/seed.ts), 18 tabelas de cadastro/referência com dados reais atuais, PII e agendamento/filas excluídos (ver §9 rodada 3, §11).
- **Testes:** 8 suites / 31 testes unitários no diagnóstico original (hoje 73, em 11 suites, após os testes adicionados nesta sessão — ver §8), todos passam; nenhum e2e (pasta `test/` inexistente apesar do script `test:e2e` referenciá-la).
- **Build/lint:** `tsc --noEmit` limpo; `nest build` sem erros; `eslint` com 35 erros de formatação e 71 warnings de variável não usada — não bloqueante.
- **CORS:** corrigido nesta sessão — configuração única, sem o bug de origem com `/` no final.
- **Prefixo de rota:** corrigido nesta sessão — `setGlobalPrefix('api')` (não existia; toda rota respondia sem `/api`, causando 404 no frontend).
- **Tratamento de erro:** corrigido nesta sessão — `responseError` resolve status/mensagem reais por tipo de erro; filtro global de exceções cobre o que escapa do try/catch de controller.
- **Monitoramento:** novo nesta sessão — log estruturado de requisição/erro via interceptor + filtro globais.
- **Segredo JWT:** fallback hardcoded `'dev-secret-key'` quando `JWT_PRIVATE_KEY` não está definido — não corrigido (depende da decisão de autorização adiada, §11).
- **Swagger:** não presente no projeto.

---

## 3. Matriz de conformidade

| ID | Área | Regra | Status | Evidência | Problema | Severidade | Correção |
|----|------|-------|--------|-----------|----------|------------|----------|
| R1 | Segurança | Guard de permissão por tag protegendo rotas | **ATENDE PARCIALMENTE (corrigido nos pontos mais críticos)** | `PermissionsGuard` + `@RequirePermission('cod')` novos em `src/auth/`, aplicados em usuários (create/update/reset-senha de terceiro), grupo-permissões (create/update), baixa (update/delete), paciente (delete/desabilitar) | As tags do sistema são de granularidade de UI (menu/botão/campo — 154 tags), não de rota de API; só foram usadas onde o mapeamento tag→ação é inequívoco. A maioria das rotas (agenda, demais cadastros) segue só com `AuthGuard('jwt')`, sem tag | **Crítico** | ✅ Corrigido para as rotas de maior risco (§9 rodada 4); estender para os demais cadastros é possível com o mesmo padrão, mas não foi feito |
| R2 | Segurança | Identidade do usuário vem do JWT verificado | **ATENDE (corrigido)** | `agenda`, `usuarios`, `sessao`, `baixa` agora usam `req.user?.username`, preenchido pelo Passport a partir do payload assinado do JWT | — | — | ✅ Corrigido (§9 item 7/8) |
| R3 | Segurança | Reset de senha exige permissão e não é previsível | **ATENDE PARCIALMENTE** | `GET /usuarios/reset-senha/:id` agora exige `CADASTRO_USUARIOS_LISTA_BOTAO_RESETAR_SENHA` | Só quem tem a tag consegue resetar senha de terceiro; a senha continua sendo sempre `'12345678'` (previsível) — isso não foi alterado | **Alto** | ✅ Permissão corrigida (§9 rodada 4); senha previsível segue pendente |
| R4 | Segurança | Escalada de privilégio bloqueada | **ATENDE PARCIALMENTE** | `POST/PUT /usuarios` agora exigem `CADASTRO_USUARIOS_BOTAO_CADASTRAR`/`_LISTA_BOTAO_EDITAR` | Quem tem a tag ainda pode setar `grupoPermissaoId`/`perfilId` livremente (sem whitelist de campo nem checagem extra de "só quem já é ADM pode promover para ADM") — reduz quem chega perto do endpoint, mas não impede um ADM legítimo de se autopromover além do previsto | **Alto** | ✅ Acesso à rota corrigido (§9 rodada 4); whitelist de campo dentro da rota segue pendente |
| R4b | Segurança | Todas as rotas de negócio exigem autenticação | **INCORRETO (corrigido)** | `vaga.controller.ts:16` tinha `@UseGuards(AuthGuard('jwt'))` **comentado** | Fila de pacientes (`/vagas/agendar`, `/vagas/devolutiva`) ficava 100% pública | **Crítico** | ✅ Guard reativado nesta sessão |
| R5 | Segurança | 401 vs 403 diferenciados | **ATENDE (corrigido)** | `resolveError` em `response.ts`, usado por `responseError` e por `AllExceptionsFilter` | Status resolvido pelo tipo real do erro (HttpException/Prisma/Error/string); nunca vaza stack trace | — | ✅ Corrigido (§9 item 25) |
| R6 | Agenda | Conflito de horário do mesmo terapeuta é rejeitado | **ATENDE (corrigido)** | `hasScheduleConflict` em `agenda.service.ts`, chamado no create e em toda edição que muda a terapeuta | Cobre evento único × único, único × recorrente e recorrente × recorrente (materializando datas com `getDates`, teto de 365 dias) | — | ✅ Corrigido (§9 item 13) — falta teste de concorrência real (duas requisições simultâneas, ver R12) |
| R7 | Agenda | Evento respeita jornada da terapeuta (8h–20h, dias trabalhados) | **ATENDE (corrigido)** | `validateJornada` em `agenda.service.ts` | Rejeita fora de 08:00–20:00, `start >= end` e dia/horário fora do `cargaHoraria` cadastrado | — | ✅ Corrigido (§9 item 12) |
| R8 | Agenda | Editar "esta e as próximas" não altera ocorrências passadas | **ATENDE (corrigido)** | `updateCalendario` não tem mais o atalho de `updateMany({where:{groupId}})`; sempre passa por `updateEventoRecorrentesAllChange`, que faz o split (trunca a antiga, cria a nova a partir da data atual) | — | ✅ Corrigido (§9 item 9) |
| R9 | Agenda | Campos bloqueados após criação (modalidade, data, horário, frequência, intervalo, dias) | **ATENDE (corrigido)** | `formatEvent(event, original)` mantém esses campos sempre do registro original, ignorando o payload | — | ✅ Corrigido (§9 item 10) |
| R10 | Agenda | Exclusão/edição de evento passado é bloqueada, com Atestado permitido | **ATENDE (corrigido)** | `isEventoPassado`, `assertSomenteStatusAlterado`, `assertStatusPermitidoParaEventoPassado` em `agenda.service.ts` | `delete()` rejeita evento já ocorrido; edição só aceita mudar `statusEventosId`, e só para **Atestado**; tolerância de 2h após o término (`TOLERANCIA_EVENTO_PASSADO_HORAS`) para não travar o check-in mobile | ✅ Corrigido (§9 itens 15, 17, 18) |
| R11 | Agenda | Exclusão de série (esta / esta+próximas / toda) definida | **NÃO ATENDE** | `delete()` sempre remove a série inteira, só se `usuarioId` bater com o criador | Sem opção parcial — decisão de negócio ainda pendente (§11 item 8) | **Alto** | Definir regra + implementar |
| R12 | Agenda | Transação nos fluxos de update/create de eventos | **ATENDE PARCIALMENTE** | `baixaService.create(...)` agora é sempre `await`ado (4 pontos); `createEventoDefault` já usava `$transaction` | Ainda não há `prisma.$transaction` real envolvendo o update do evento + criação da baixa juntos — se a baixa falhar depois do evento salvo, não há rollback | **Alto** | `$transaction` real |
| R13 | Filas | Transição avaliação→devolutiva→terapia é transacional e idempotente | **INCORRETO (parcialmente corrigido)** | `VagaService.update()` usa `Promise.all` (não é transação); `case queue_avaliation` sem `break` antes de `case avaliation` | Fallthrough duplicava efeito; falta de transação persiste | **Crítico** | ✅ `break` corrigido nesta sessão; `$transaction` real ainda pendente |
| R14 | Filas | Fila é modelada por entidade/estado explícito | **ATENDE PARCIALMENTE** | `Vaga` + `VagaOnEspecialidade` fazem o papel de máquina de estados, sem histórico tipado | Difícil auditar transições | **Médio** | Formalizar histórico |
| R15 | Baixa | Um evento não recebe duas baixas ativas | **ATENDE PARCIALMENTE** | `baixa.service.ts create()` verifica antes de criar e agora loga/sinaliza (`{duplicate:true}`) em vez de retornar `undefined` em silêncio | Ainda sem `@@unique(eventoId)` a nível de banco — a checagem em código tem race condition entre o `findMany` e o `create` | **Médio** | `@@unique(eventoId)` |
| R16 | Baixa | Exclusão de baixa preserva histórico/motivo | **NÃO ATENDE** | `delete()` faz `prisma.baixa.delete` — física | Sem motivo, sem auditoria | **Alto** | Soft delete + auditoria |
| R17 | Financeiro | Snapshot do valor/comissão no momento do evento | **NÃO ATENDE** | `FinanceiroService` lê `VagaOnEspecialidade.valor`/`TerapeutaOnFuncao.comissao` atuais | Alterar valor hoje reescreve relatórios antigos | **Crítico** | Persistir snapshot no evento/baixa |
| R18 | Financeiro | Precisão monetária (Decimal) | **ATENDE (corrigido)** | `VagaOnEspecialidade.valor`/`.km`, `TerapeutaOnFuncao.comissao`, `Calendario.km` agora `Decimal(10,2)` no schema **e no banco real** (confirmado via `information_schema`); leitura/escrita via `readDecimal`/`normalizeCurrencyValue` | Dados existentes normalizados antes da migration (havia NBSP + vírgula decimal) | — | ✅ Corrigido (§9 item 20/21) |
| R19 | Financeiro | Valor por km e valor de devolutiva configuráveis | **ATENDE (corrigido)** | `FINANCEIRO_VALOR_POR_KM`/`FINANCEIRO_VALOR_SESSAO_DEVOLUTIVA` em `financeiro.service.ts` | Configurável via env var, default igual ao valor antigo | — | ✅ Corrigido (§9 item 22) |
| R20 | Cadastros | Exclusão bloqueada quando entidade está em uso | **NÃO ATENDE** | `delete()` de Especialidade/Função/Localidade/StatusEvento fazem hard delete direto | FK do Prisma rejeita com erro cru (500 genérico) | **Médio** | Checar uso antes de excluir, ou usar `ativo=false` |
| R21 | Cadastros | Endpoints `DELETE /:id` funcionam | **INCORRETO (corrigido)** | 13 controllers usavam `@Param() id: number` (sem chave) → `id` virava o objeto `{id:'...'}` inteiro → `Number(id)` = `NaN` em todos os services | **Todo** endpoint de exclusão de cadastro estava quebrado (paciente, especialidade, função, localidade, status-evento, modalidade, período, perfil, status, tipo-sessão, convênio, frequência, sessão) | **Alto** | ✅ Corrigido nesta sessão (`@Param('id')` em todos) |
| R22 | Cadastros | `PacienteService.delete()` remove o paciente | **INCORRETO (corrigido)** | `delete(id)` executava `prisma.localidade.delete(...)` — apagava uma **Localidade**, não o Paciente | Bug de corrupção de dados | **Crítico** | ✅ Corrigido nesta sessão — agora inativa o paciente (`disabled:true`), preservando histórico |
| R23 | Terapeuta | Terapeuta tem uma especialidade e várias funções dentro dela | **ATENDE** | `Terapeuta.especialidadeId` (FK única) + `TerapeutaOnFuncao` (N:N terapeuta↔função) | — regra confirmada pelo negócio, modelo já correto | — | Nenhuma (item removido da lista de problemas) |
| R24 | Terapeuta | Jornada 8h–20h validada no backend, sem sobreposição | **ATENDE (corrigido)** | Mesma implementação do R7 (`validateJornada`) — terapeuta só tem 1 jornada, não há "sobreposição entre terapeutas" aplicável aqui, sobreposição de horário é o R6 | — | — | ✅ Corrigido (§9 item 12) |
| R25 | Terapeuta | Perfil de usuário validado por enum fixo (Admin/Coordenadora/Terapeuta/Secretária) | **ATENDE PARCIALMENTE** | `validatePerfilId()` em `user.service.ts` agora rejeita `perfilId` inexistente/ausente | `Perfil` continua tabela livre (nome não é um enum fixo dos 4 papéis do enunciado) e `ID_PERFIL_TERAPEUTA.id = 5` continua um ID mágico hardcoded | **Médio** | ✅ Validação de existência corrigida (§9 item 27); ID mágico e enum fixo dos 4 papéis seguem pendentes |
| R26 | Vagas/Filas | Vínculo especialidade↔paciente/terapeuta validado no agendamento | **ATENDE (corrigido)** | `validateAgendamentoVinculos` em `agenda.service.ts` | Rejeita especialidade que a terapeuta não tem, função fora da especialidade, terapeuta sem a função, especialidade não vinculada ao paciente — mesmo com IDs manuais | — | ✅ Corrigido (§9 item 11) |
| R27 | Cancelamento | Antecedência mínima calculada e status escolhido automaticamente | **ATENDE (corrigido)** | `resolveStatusCancelamento` em `agenda.service.ts` | Backend recalcula com 48h corridas até o início do evento sendo alterado; substitui silenciosamente o status enviado quando for um dos dois de cancelamento | — | ✅ Corrigido (§9 item 14) |
| R28 | Migrations/Seeds | Migrations versionadas e seeds dos cadastros mínimos | **ATENDE PARCIALMENTE** | [prisma/seed.ts](prisma/seed.ts) criado com 18 tabelas de cadastro real, idempotente (`upsert`) | Ainda sem `prisma/migrations/` (schema continua indo por `db push`) | **Alto** | ✅ Seed criado (§9 rodada 3 item 30); migrations formais seguem pendentes |
| R29 | Multiclínica | Isolamento por clínica/tenant | **NÃO ATENDE** | Nenhuma entidade tem campo de tenant | Não aplicável hoje (mono-clínica) | Informativo | Definir se é requisito futuro |
| R30 | Consulta de agenda | API consulta só o período pedido | **ATENDE** | `getFilter`/`getRange` usam `buildDateRangeWhere` | — | — | — |
| R31 | Paginação | Tamanho de página tem limite máximo no backend | **ATENDE (corrigido)** | `normalizePageSize` em `src/util/pagination.ts`, aplicado nos 13 controllers paginados | Teto de 100 itens por página | — | ✅ Corrigido (§9 rodada 1 item 6) |
| R32 | Agenda | Evento passado só aceita status Atestado | **ATENDE (corrigido)** | `assertStatusPermitidoParaEventoPassado` em `agenda.service.ts` | Definição fechada com o negócio; qualquer outro status é rejeitado | — | ✅ Corrigido (§9 rodada 2 item 17) |
| R33 | Agenda | Tolerância de 2h após o término antes de considerar o evento "passado" | **ATENDE (corrigido)** | `TOLERANCIA_EVENTO_PASSADO_HORAS` em `isEventoPassado`, `agenda.service.ts` | Evita quebrar o check-in mobile (`PUT /evento/check`, marca Atendido), que roda perto do fim da sessão | — | ✅ Corrigido (§9 rodada 2 item 18) |
| R34 | Cadastros | Feriados nacionais usados no cálculo de disponibilidade/dia útil | **ATENDE (corrigido)** | `calcularFeriadosNacionais()` em `format-date.ts` | Antes era lista fixa só até 2022 (e com bug de formato de data que a deixava sem efeito nenhum); agora calcula fixos + móveis (Páscoa) para janela de anos ao redor de hoje. Não cobre feriado municipal/estadual | — | ✅ Corrigido (§9 rodada 3 item 28) |
| R35 | Segurança | Log estruturado de requisição/erro | **ATENDE (corrigido)** | `LoggingInterceptor` + `AllExceptionsFilter`, globais em `main.ts` | — | — | ✅ Novo (§9 rodada 3 item 31) |

---

## 4. Problemas encontrados

### Críticos — ainda abertos
1. Sem autorização por permissão (R1) — decisão de negócio: adiada por falta de catálogo de tags (§11 item 4).
2. Reset de senha sem permissão, para senha fixa conhecida (R3) — depende da mesma decisão do item 1.
3. Mass assignment de `grupoPermissaoId`/`perfilId` (R4) — depende da mesma decisão do item 1.
4. Ausência de transação real nos fluxos de fila (R13) — `switch` corrigido, `$transaction` ainda pendente.
5. Financeiro sem snapshot (R17) — `Decimal` corrigido, mas o cálculo ainda lê o valor *atual* do cadastro; alterar um valor hoje ainda reescreve relatório de período fechado.
6. Exclusão de série recorrente sem granularidade "só esta" (R11) — decisão de negócio pendente (§11 item 8).

### Críticos — corrigidos nesta sessão
- ~~`VagaController` sem autenticação nenhuma~~ — corrigido (R4b).
- ~~Identidade via header `login` falsificável~~ — corrigido (R2).
- ~~Nenhuma checagem de conflito de horário~~ — corrigido (R6).
- ~~Evento fora da jornada da terapeuta era aceito~~ — corrigido (R7/R24).
- ~~`changeAll` reescrevia ocorrências passadas~~ — corrigido (R8).
- ~~Campos bloqueados (modalidade/data/horário/frequência/intervalo/dias) graváveis via update~~ — corrigido (R9).
- ~~`switch` sem `break` em `VagaService.update`~~ — corrigido (R13).
- ~~`PacienteService.delete()` apagava uma `Localidade`~~ — corrigido (R22).
- ~~Vínculo especialidade/terapeuta/função não validado no `createCalendario`~~ — corrigido (R26).
- ~~Regra de antecedência de cancelamento não existia no backend~~ — corrigido, 48h (R27).
- ~~Evento passado editável/excluível livremente~~ — corrigido: exclusão bloqueada, edição só aceita status = Atestado, com tolerância de 2h (R10, R32, R33).
- ~~Valores monetários como `String` (risco de corrupção/parsing quebradiço)~~ — corrigido: migrado para `Decimal(10,2)` no banco real (R18).
- ~~`responseError` sempre 401 pra tudo~~ — corrigido: status/mensagem reais por tipo de erro (R5).
- ~~`GET /especialidade` (e toda rota) respondendo 404~~ — corrigido: faltava `setGlobalPrefix('api')` e o endpoint `getAll` inteiro.
- ~~`Baixa.create` silenciosa em duplicidade~~ — corrigido: agora loga e sinaliza (R15, ainda sem `@@unique` de banco).
- ~~`perfilId` sem validação~~ — corrigido: valida contra a tabela `Perfil` (R25, ID mágico e enum fixo seguem pendentes).
- ~~CORS redundante/conflitante~~ — corrigido: configuração única, origem de produção com bug de `/` corrigido.

### Altos
- Exclusão de baixa é física, sem motivo/auditoria (R16) — não tratado.
- Ausência de migrations formais (`prisma migrate`) (R28) — seed criado, migrations seguem ausentes.
- `.env` foi commitado no histórico do git antes de entrar no `.gitignore` — recomenda-se rotacionar as credenciais reais (banco, JWT, sessão) que circularam; ver §11.
- Segredo JWT com fallback hardcoded (`'dev-secret-key'`) quando `JWT_PRIVATE_KEY` não está definido — não tratado.
- ~~13 endpoints `DELETE /:id` quebrados~~ — **corrigidos** (R21).
- ~~`cargaHoraria` sem validação~~ — **corrigido** (R24).
- ~~Valor por km/devolutiva hardcoded no código~~ — **corrigido**, agora configurável por env var (R19).

### Médios
- Exclusão física de cadastros auxiliares sem checar uso (R20).
- ~~`Baixa.create` falha silenciosamente em duplicidade~~ — **corrigido** (R15, movido para críticos-corrigidos acima).
- ~~`perfilId` não validado contra enum/tabela~~ — **corrigido** (R25, movido para críticos-corrigidos acima).
- ~~`FERIADOS` hardcoded só até 2022, desatualizado~~ — **corrigido**: cálculo dinâmico (R34).
- ~~`$queryRawUnsafe` em `findDuplicateFullNames`~~ — **corrigido**: reescrito com query builder do Prisma.
- ~~Paginação sem teto~~ — **corrigido** (R31).

### Baixos
- 71 warnings de lint, 35 erros de formatação Prettier — não tratado.
- Dois mecanismos de sessão coexistindo sem necessidade — não tratado.
- ~~`console.log` no lugar de logger estruturado~~ — **parcialmente corrigido**: requisições e erros agora passam pelo logger estruturado do Nest (interceptor + filtro globais); `console.log`/`console.warn` pontuais dentro dos services não foram todos substituídos (mudança mecânica de baixo valor, não priorizada).

---

## 5. Regras somente no frontend

| Regra | Backend valida? | Risco |
|---|---|---|
| Grupo de permissão só editável por quem tem permissão | **Não** | Crítico — decisão de negócio adiada (§11 item 4) |
| Reset de senha exige permissão | **Não** | Crítico — mesma decisão acima |
| 401 vs 403 diferenciados na resposta | **Não** (sempre 401) | Alto |
| Exclusão de baixa preserva motivo/auditoria | **Não** (exclusão física) | Alto |
| Snapshot financeiro no momento do evento | **Não** (recalculado do cadastro atual) | Crítico |
| Exclusão de série recorrente "só esta"/"esta e as próximas" | **Não** (só existe excluir a série inteira) | Alto — decisão de negócio pendente (§11 item 8) |

**Corrigidas nesta sessão (deixaram de ser só-frontend):** conflito de horário do terapeuta, jornada 8h–20h, antecedência de cancelamento, vínculo especialidade↔paciente/terapeuta/função, campos bloqueados após criação do evento, exclusão/edição de evento passado (incluindo a regra "só Atestado" e a tolerância de 2h) — todas agora validadas no backend, ver §3 (R2, R6, R7, R8, R9, R10, R24, R26, R27, R32, R33).

---

## 6. Endpoints encontrados (amostra)

| Método | Rota | Controller | Permissão | Observação |
|---|---|---|---|---|
| POST | `/login` | auth.controller.ts | `AuthGuard('local')` | OK |
| POST | `/evento` | agenda.controller.ts | `AuthGuard('jwt')` (sem tag) | ✅ Conflito de horário, jornada e vínculo especialidade/terapeuta/função agora validados (`validateEvento`) |
| PUT | `/evento` | agenda.controller.ts | `AuthGuard('jwt')` (sem tag) | ✅ Campos bloqueados travados, revalida conflito/jornada se a terapeuta muda, status de cancelamento recalculado (48h), evento passado só aceita status Atestado (tolerância 2h) |
| DELETE | `/evento` | agenda.controller.ts | `AuthGuard('jwt')` (sem tag) | ✅ Bloqueia evento passado (com tolerância de 2h); segue sem granularidade "só esta ocorrência" — remove a série inteira |
| PUT | `/evento/check` | agenda.controller.ts | `AuthGuard('jwt')` (sem tag) | Check-in mobile (marca Atendido) — dentro da tolerância de 2h continua funcionando normalmente |
| POST | `/usuarios` | user.controller.ts | `AuthGuard('jwt')` (qualquer autenticado) | Mass assignment de grupo/perfil — **não corrigido**, decisão adiada |
| GET | `/usuarios/reset-senha/:id` | user.controller.ts | `AuthGuard('jwt')` (qualquer autenticado) | Reset para senha fixa sem permissão — **não corrigido**, decisão adiada |
| PUT | `/vagas/agendar`, `/vagas/devolutiva` | vaga.controller.ts | `AuthGuard('jwt')` | ✅ Guard reativado (estava comentado/público) |
| PUT | `/baixa` | baixa.controller.ts | `AuthGuard('jwt')` | ✅ `usuarioId` agora vem do JWT, não mais do corpo da requisição |
| DELETE | `/paciente/:id`, `/especialidade/:id`, `/funcao/:id`, `/localidade/:id`, `/status-eventos/:id`, `/modalidade/:id`, `/periodo/:id`, `/perfil/:id`, `/status/:id`, `/tipo-sessao/:id`, `/convenio/:id`, `/frequencia/:id`, `/sessao/:id` | 13 controllers | `AuthGuard('jwt')` | ✅ Bug de `@Param()` corrigido — endpoints estavam todos quebrados |

---

## 7. Modelo de dados

- `Terapeuta.especialidadeId` (1 especialidade) + `TerapeutaOnFuncao` (N funções, com `comissao`/`tipo` por função) — **modelagem correta**, confirmada pelo negócio.
- Ausência de snapshot financeiro em `Calendario`/`Baixa`.
- Datas e valores monetários como `String`, não `DateTime`/`Decimal`.
- Sem `@unique` em `Paciente.carteirinha`, `StatusEventos.nome`, `Especialidade.nome`, `Funcao.nome`.
- `Baixa` sem `@@unique([eventoId])`.
- Sem `@@index` em `Calendario`/`Baixa` para as consultas mais frequentes.
- Campo `ativo` existe em vários cadastros mas os `delete()` de service fazem hard delete em vez de usá-lo.

---

## 8. Testes

Estado original: 31 testes unitários (formatação/filtro), 8 suites. Nenhum cobria: permissões, conflito de horário, transição de fila, cancelamento com/sem antecedência, baixa duplicada, financeiro com snapshot, concorrência, isolamento entre clínicas. Nenhum teste e2e.

**Após as correções desta sessão: 73 testes, 11 suites.** Distribuição dos 42 novos:

- [agenda.service.spec.ts](src/agenda/agenda.service.spec.ts) (19): `hasScheduleConflict` (sobreposição parcial, horário idêntico, encostado sem sobrepor, evento cancelado ignorado), `validateJornada` (fora de 8h–20h, início ≥ fim, dia sem jornada cadastrada, dentro da jornada), `isEventoPassado`/`assertSomenteStatusAlterado` (passado vs. futuro, dentro/fora da tolerância de 2h, campo bloqueado rejeitado, só status permitido), `assertStatusPermitidoParaEventoPassado` (só Atestado aceito), `resolveStatusCancelamento` (status não-cancelamento intocado, <48h/≥48h).
- [response.spec.ts](src/util/response.spec.ts) (11, novo): status/mensagem reais por `HttpException` (401/403/404/400), por código do Prisma (P2025/P2002/P2003), por `Error` genérico, por string customizada, fallback 500 sem vazar stack.
- [format-date.spec.ts](src/util/format-date.spec.ts) (3, novo): feriados fixos e móveis de um ano, offset do Carnaval em relação à Páscoa em anos distintos.
- [baixa.service.spec.ts](src/baixa/baixa.service.spec.ts) (+2): duplicidade sinalizada sem criar de novo, criação normal quando não há duplicidade.
- [permissions.guard.spec.ts](src/auth/permissions.guard.spec.ts) (7, novo): rota sem `@RequirePermission` libera direto, sem usuário autenticado bloqueia, perfil Developer sempre libera, usuário com a tag libera, usuário sem a tag rejeita com 403, usuário sem grupo é tratado como sem permissão nenhuma, usuário inexistente bloqueia.

Ainda faltam: testes de `createCalendario`/`updateCalendario` ponta a ponta (com Prisma mockado ou banco de teste), transição de fila, financeiro, concorrência, isolamento entre clínicas e e2e — não cobertos nesta sessão.

---

## 9. Ajustes já aplicados nesta sessão

Escopo desta primeira leva: **apenas correções mecânicas e não-ambíguas**, sem decisão de negócio pendente e sem mudança de contrato de API além de corrigir o que já estava quebrado. Cada um foi validado com `tsc --noEmit`, `nest build` e `npx jest` (31/31 continuam passando).

| # | Arquivo(s) | O que estava errado | O que foi feito |
|---|---|---|---|
| 1 | 13 controllers (`paciente`, `especialidade`, `funcao`, `localidade`, `status-evento`, `modalidade`, `periodo`, `perfil`, `status`, `tipo-sessao`, `convenio`, `frequencia`, `sessao`) | `@Param() id: number` (sem chave) fazia o Nest injetar o objeto `req.params` inteiro em vez do valor de `id`; todo `DELETE /:id` sempre falhava (`Number({...})` = `NaN`) | Trocado para `@Param('id') id: string` e conversão para número feita no service (que já usava `Number(id)`/`toNumberId(id)`) |
| 2 | [src/paciente/paciente.service.ts](src/paciente/paciente.service.ts) | `delete(id)` executava `prisma.localidade.delete(...)` — apagava um registro de **Localidade**, não o paciente | Reescrito para inativar o paciente (`prisma.paciente.update({ where: { id }, data: { disabled: true } })`), preservando histórico clínico/financeiro em vez de excluir fisicamente |
| 3 | [src/vaga/vaga.controller.ts](src/vaga/vaga.controller.ts) | `@UseGuards(AuthGuard('jwt'))` estava **comentado** — toda a fila de pacientes ficava acessível sem login | Guard reativado |
| 4 | [src/vaga/vaga.service.ts](src/vaga/vaga.service.ts) | `switch` sem `break` entre `case STATUS_PACIENT_COD.queue_avaliation` e `case STATUS_PACIENT_COD.avaliation` em `update()` — os dois blocos rodavam juntos por engano | Adicionado `break` ao final do bloco `queue_avaliation` |
| 5 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) | `this.baixaService.create(...)` era chamado **sem `await`** em 4 pontos (`updateCalendario`, `updateEventoUnicoGrupo`, `updateEventoRecorrentes`, `updateEventoRecorrentesAllChange`) — erro viraria unhandled rejection e a resposta ao cliente não esperava a baixa ser gravada | Adicionado `await` em todas as chamadas |
| 6 | [src/util/pagination.ts](src/util/pagination.ts) + pontos de uso | `pageSize` vindo do cliente sem teto — permitia dump de tabela inteira | Adicionado teto máximo de página (defensivo, não quebra contrato existente) |

### Rodada 2 — identidade, agenda (conflito/jornada/vínculos), recorrência, cancelamento e evento passado

Antes de começar, 4 decisões de negócio que estavam pendentes (§11 da v1) foram fechadas com você:

* **Autorização por tag**: adiada. Sem catálogo de permissões existente, implementar guard de tag agora arriscava travar acesso de usuários legítimos. Nesta rodada só a **identidade** (quem está fazendo a chamada) foi corrigida — a checagem "essa pessoa pode fazer isso" continua pendente para quando o catálogo de tags for definido.
* **Antecedência de cancelamento**: 48 horas corridas até o início do evento (não 24h, não D-1).
* **Recorrência sem `dataFim`**: é o comportamento esperado (paciente ainda em atendimento, sem previsão de alta) — não é um bug. Nenhuma trava foi adicionada aqui; a arquitetura já existente (1 linha por série + `groupId` + `exdate` + `isChildren` para exceções) foi mantida e um bug real dentro dela foi corrigido (ver item 8 abaixo).
* **Campos bloqueados enviados diferentes do salvo**: ignorados silenciosamente (mantém o valor original), sem rejeitar a requisição inteira.

Todos os itens abaixo foram validados com `tsc --noEmit`, `nest build` e `npx jest` (50/50 passando, 19 testes novos cobrindo especificamente esta rodada em [agenda.service.spec.ts](src/agenda/agenda.service.spec.ts)).

| # | Arquivo(s) | O que estava errado | O que foi feito |
|---|---|---|---|
| 7 | [src/agenda/agenda.controller.ts](src/agenda/agenda.controller.ts), [src/user/user.controller.ts](src/user/user.controller.ts), [src/sessao/sessao.controller.ts](src/sessao/sessao.controller.ts) | Identidade de quem cria/edita/exclui vinha de `req.headers.login`, um header livre que o cliente controla | Trocado por `req.user?.username`, que o Passport preenche a partir do payload **assinado** do JWT (`sub`/`username`), verificado na estratégia `jwt.strategy.ts` |
| 8 | [src/baixa/baixa.controller.ts](src/baixa/baixa.controller.ts), [src/baixa/baixa.service.ts](src/baixa/baixa.service.ts), [src/baixa/baixa.module.ts](src/baixa/baixa.module.ts) | `usuarioId` de quem deu baixa vinha direto do corpo da requisição (`body.usuarioId`) — o cliente podia atribuir a baixa a qualquer usuário | `BaixaService.update` agora resolve o usuário a partir do login autenticado (via `UserService`, importado no módulo) |
| 9 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `formatEvent` | `changeAll` (via `updateCalendario`) fazia `prisma.calendario.updateMany({ where: { groupId } })` quando já existiam múltiplas linhas no grupo — sobrescrevia `dataInicio`/ocorrências passadas/exceções já materializadas (`isChildren`) do mesmo grupo | Removido esse atalho; `changeAll` agora sempre passa por `updateEventoRecorrentes` → `updateEventoRecorrentesAllChange`, que faz o split correto (série antiga ganha `dataFim` de corte, série nova nasce da data atual) — o mesmo padrão que você descreveu já usar |
| 10 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `formatEvent(event, original)` | Nenhum campo era travado após a criação do evento | `formatEvent` agora aceita o registro original e sempre mantém dele `dataInicio`, `start`, `end`, `modalidadeId`, `frequenciaId`, `intervaloId`, `diasFrequencia`, ignorando silenciosamente valor diferente enviado pelo cliente. Aplicado nos 4 pontos de update (edição de ocorrência única, "só esta", "esta e as próximas", evento único) |
| 11 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `validateAgendamentoVinculos` | `createCalendario` não validava se a especialidade pertence ao paciente, se a terapeuta possui a especialidade/função, ou se paciente/terapeuta/função/status/local estão ativos | Novo validador chamado na criação (evento default e devolutiva) e em toda edição que muda paciente/especialidade/terapeuta/função/local/status; rejeita IDs incompatíveis mesmo enviados manualmente |
| 12 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `validateJornada` | Jornada da terapeuta (`cargaHoraria`, 8h–20h) só era usada para montar a grade visual, nunca para validar criação/edição | Novo validador: rejeita horário fora de 08:00–20:00, `start >= end`, e qualquer dia/horário fora do `cargaHoraria` cadastrado da terapeuta. Roda na criação e sempre que a terapeuta muda numa edição |
| 13 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `hasScheduleConflict` | Nenhuma checagem de conflito de horário em lugar nenhum — dupla marcação era sempre aceita | Novo validador: materializa as datas da série nova e de cada série existente da mesma terapeuta (respeitando frequência/intervalo/exdate, com teto de 365 dias para série sem fim) e rejeita sobreposição de horário; ignora eventos cancelados |
| 14 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `resolveStatusCancelamento` | Cliente escolhia livremente entre "Cancelado com Antecedência" (não cobra) e "Cancelado sem Antecedência" (cobra) | Backend recalcula com base em 48h corridas até o início da ocorrência sendo alterada, sempre que o status enviado for um desses dois — silenciosamente substitui pelo correto. A criação de baixa decorrente agora usa o status corrigido, não o enviado |
| 15 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `isEventoPassado` / `assertSomenteStatusAlterado` | Evento com horário final já passado podia ser editado (qualquer campo) ou excluído livremente | `delete()` agora rejeita evento já ocorrido; toda edição de evento passado só aceita mudança de `statusEventosId` — qualquer outro campo diferente do original (paciente/especialidade/terapeuta/função/local/observação) é rejeitado com erro |
| 16 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `delete()` | Erros dentro de `delete()` (incluindo o novo bloqueio de evento passado) eram só logados no console; o controller respondia sucesso mesmo sem excluir nada | `catch` agora relança o erro, que chega ao controller como falha real |
| 17 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `assertStatusPermitidoParaEventoPassado` | "Alteração de status autorizada" em evento passado não tinha lista definida | Fechado com você: **apenas Atestado**. Qualquer outro status em evento passado é rejeitado, mesmo que `assertSomenteStatusAlterado` já garanta que só o status mudou |
| 18 | [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) — `isEventoPassado` / `TOLERANCIA_EVENTO_PASSADO_HORAS` | A regra "só Atestado" do item 17 quebraria o check-in mobile (`PUT /evento/check`, marca Atendido), que normalmente roda durante/logo após a sessão | Fechado com você: tolerância de **2 horas após o término** — dentro dessa janela o evento não é considerado "passado" (qualquer status vale); só depois das 2h a trava de "somente Atestado" passa a valer |

**Fora do escopo desta rodada (decisão de negócio pendente ou exige migration de banco — ver §11):** autorização por tag, whitelist de `grupoPermissaoId`/`perfilId` (escalada de privilégio), permissão para reset de senha, snapshot financeiro (`Calendario`/`Baixa`), soft delete/auditoria de baixa e cadastros em uso, `prisma.$transaction` real nas transições de fila, unicidade de carteirinha/nomes, índices de banco, migrations formais (o seed foi criado nesta sessão, ver rodada 3).

### Rodada 3 — CORS, migration financeira, 404, tratamento de erro, feriados, seed e monitoramento

Validado com `tsc --noEmit`, `nest build`, `npx jest` (73/73 passando, ver rodada 4 abaixo para os 7 mais recentes).

| # | Arquivo(s) | O que estava errado | O que foi feito |
|---|---|---|---|
| 19 | [src/main.ts](src/main.ts) | `app.enableCors()` aberto + lista restrita com `/` no final da origem de produção (nunca batia com o header `Origin` real) + middleware `cors({origin:'*'})` duplicado em `app.module.ts` | Consolidado em uma única chamada `enableCors`, origem de produção corrigida (sem `/`), middleware duplicado removido |
| 20 | `VagaOnEspecialidade.valor`/`.km`, `TerapeutaOnFuncao.comissao`, `Calendario.km` (schema + banco remoto) | Campos `String`, com valores gravados como `" 200,00"` (espaço não-quebrável + vírgula) — um `ALTER TABLE` cru teria truncado esses valores | Dados normalizados linha a linha em JS (`.trim()` cobre NBSP, que o `TRIM()` do MySQL não remove) antes de qualquer mudança de schema; campos migrados para `Decimal(10,2)` no `prisma/schema.prisma` **e aplicados no banco real** (`prisma db push --accept-data-loss`, confirmado via `information_schema.COLUMNS`: os 4 campos já são `decimal`) |
| 21 | [src/paciente/paciente.service.ts](src/paciente/paciente.service.ts), [src/user/user.service.ts](src/user/user.service.ts), [src/financeiro/financeiro.service.ts](src/financeiro/financeiro.service.ts), [src/agenda/agenda.service.ts](src/agenda/agenda.service.ts) | Leitura/escrita desses 4 campos via `.split('R$')[1]`, `.replace(',', '.')` e `parseFloat` manual espalhados pelo código — quebrariam com `Decimal` do Prisma (não tem `.replace`) | Centralizado em dois helpers novos em [src/util/normalizers.ts](src/util/normalizers.ts): `normalizeCurrencyValue` (escrita, aceita "R$ 200,00"/"200,00"/número) e `readDecimal` (leitura seguro de `Decimal` do Prisma) |
| 22 | [src/financeiro/financeiro.service.ts](src/financeiro/financeiro.service.ts) | `* 0.9` (valor/km) e `= 50` (valor de sessão de devolutiva) hardcoded no meio do cálculo | Externalizado para `FINANCEIRO_VALOR_POR_KM`/`FINANCEIRO_VALOR_SESSAO_DEVOLUTIVA` (env var, com default igual ao valor antigo — nada muda até alguém configurar) |
| 23 | [src/main.ts](src/main.ts) | Nenhum controller tinha prefixo `api/`, sem `setGlobalPrefix` — toda rota só existia em `/algo`, nunca `/api/algo`. Frontend chama `/api/especialidade` → 404 | `app.setGlobalPrefix('api')` |
| 24 | [src/especialidade/especialidade.controller.ts](src/especialidade/especialidade.controller.ts), [src/especialidade/especialidade.service.ts](src/especialidade/especialidade.service.ts) | Além do prefixo, `EspecialidadeController` nunca teve endpoint `GET` paginado (só tinha `dropdown`/`:search`/`create`/`update`/`delete`) — era a segunda causa do 404 do print | Adicionado `getAll(page, pageSize)`, no mesmo padrão dos módulos irmãos (função, localidade, etc.) |
| 25 | [src/util/response.ts](src/util/response.ts) | `responseError` sempre retornava `401 { message: 'Erro na conexão!' }`, e a maioria dos ~150 `catch` nos controllers nem repassava o `error` capturado | Reescrito: resolve status/mensagem reais a partir do tipo do erro (`HttpException` → status real; `Prisma.PrismaClientKnownRequestError` P2025/P2002/P2003 → 404/409/409 com mensagem amigável; `Error` genérico → 400 com a mensagem; string customizada → 400; desconhecido → 500 genérico sem vazar stack). Todos os ~150 `catch (error) { responseError(response); }` dos controllers agora passam `error` de verdade. 11 testes novos em [response.spec.ts](src/util/response.spec.ts) |
| 26 | [src/baixa/baixa.service.ts](src/baixa/baixa.service.ts) | `create()` retornava `undefined` em silêncio quando já existia baixa para o evento, e um `catch` genérico engolia qualquer erro real | Duplicidade agora loga (`console.warn`) e retorna `{ created: false, duplicate: true, baixa }` em vez de `undefined`; catch-all removido (erro real propaga). 2 testes novos |
| 27 | [src/user/user.service.ts](src/user/user.service.ts) | `perfilId` era aceito sem checar se existe na tabela `Perfil` | Novo `validatePerfilId()`, chamado em `create()` e `update()`; rejeita id inexistente/ausente antes de gravar |
| 28 | [src/util/format-date.ts](src/util/format-date.ts) | `FERIADOS` era uma lista fixa só até 2022 (evento/disponibilidade calculado a partir de 2023 não considerava feriado nenhum); além disso `holidayFormat: 'YYYY-MM-DD'` estava configurado mas a lista antiga usava `DD-MM-YYYY` — nunca bateu | Feriados nacionais agora calculados dinamicamente (fixos + móveis via Páscoa, algoritmo de Meeus/Jones/Butcher) para uma janela de anos ao redor de hoje, no formato correto. Não cobre feriado municipal/estadual. 3 testes novos em [format-date.spec.ts](src/util/format-date.spec.ts) |
| 29 | [src/paciente/paciente.service.ts](src/paciente/paciente.service.ts) | `findDuplicateFullNames()` usava `$queryRawUnsafe` com SQL escrito à mão (sem input do usuário hoje, mas padrão arriscado de manter) | Reescrito com o query builder do Prisma (`findMany` + agrupamento em JS) |
| 30 | [prisma/seed.ts](prisma/seed.ts) (novo) | Sem seed nenhum — R28 do diagnóstico original | Seed gerado a partir dos dados **reais atuais** de 18 tabelas de cadastro/referência (convênio, especialidade, função, localidade, status de evento, frequência, modalidade, intervalo, período, status, tipo de sessão, status de paciente, perfil, permissão, grupo de permissão, programa, atividades VB-MAPP/Portage). **Decisão tomada por mim, não pedida explicitamente**: excluí `Usuario`/`Terapeuta`/`TerapeutaOnFuncao`/`Paciente`/`PacienteHistorico` do seed além de agendamento/filas — são dados de pessoas reais (nome, telefone, hash de senha) e versionar isso no git exporia PII permanentemente no histórico. Idempotente (`upsert`), configurado em `package.json` (`npm run seed` / `npx prisma db seed`). Não rodei contra o banco remoto (upsert de um snapshot antigo poderia sobrescrever uma edição concorrente feita depois do dump) |
| 31 | [src/util/logging.interceptor.ts](src/util/logging.interceptor.ts), [src/util/all-exceptions.filter.ts](src/util/all-exceptions.filter.ts) (novos) | Nenhum log estruturado de requisição/erro — só `console.log` esparsos e inconsistentes pelos services | Interceptor global loga toda requisição (método, rota, usuário, status, duração); filtro global captura erro que escapa do try/catch de controller (guard, pipe) usando a mesma lógica de status/mensagem do item 25. Smoke-testado manualmente (sem token → 401 logado; rota inexistente → 404 logado; login inválido → 401 com mensagem real logado) |
| 32 | [tsconfig.build.json](tsconfig.build.json) | **Bug que eu mesmo introduzi** ao criar `prisma/seed.ts`: sem esse arquivo excluído do build, o TypeScript recalculava o `rootDir` para a raiz do projeto (em vez de `src/`), e `nest build` passou a gerar `dist/src/main.js` em vez de `dist/main.js` — quebrando `npm run start:prod` (`node dist/main`) e o `Procfile` de produção | Adicionado `"prisma"` ao `exclude` de `tsconfig.build.json`; rebuild limpo confirmou `dist/main.js` de volta ao lugar certo antes de considerar a rodada concluída |

### Rodada 4 — autorização por tag nas rotas de maior risco

O seed (item 30) trouxe o catálogo real de `Permissao`/`GrupoPermissao`/`GrupoPermissaoOnPermissao` (154 tags, 5 grupos). Inspecionei os dados antes de codar: as tags são de granularidade de **UI** (menu/botão/campo — ex.: `CADASTRO_USUARIOS_LISTA_BOTAO_RESETAR_SENHA`, `AGENDA_CALENDARIO_EVENTO_EDITAR_TERAPEUTA`), não de rota de API 1:1. Por isso a autorização por tag só foi aplicada onde o mapeamento tag → ação é inequívoco — as rotas mais perigosas identificadas desde a v1 do relatório (R1/R3/R4).

Validado com `tsc --noEmit`, `nest build`, `npx jest` (73/73 passando, 7 testes novos em [permissions.guard.spec.ts](src/auth/permissions.guard.spec.ts)).

| # | Arquivo(s) | O que estava errado | O que foi feito |
|---|---|---|---|
| 33 | [src/auth/permissions.guard.ts](src/auth/permissions.guard.ts), [src/auth/require-permission.decorator.ts](src/auth/require-permission.decorator.ts) (novos) | Nenhum guard checava tag de permissão em rota nenhuma | `PermissionsGuard` + `@RequirePermission('cod')`: busca o grupo do usuário autenticado (pelo login do JWT) e confere se tem alguma das tags exigidas; perfil "Developer" sempre passa (mesmo bypass já usado no login); rota sem `@RequirePermission` não é afetada |
| 34 | [src/user/user.controller.ts](src/user/user.controller.ts) | `POST/PUT /usuarios` e `GET /usuarios/reset-senha/:id` abertos a qualquer autenticado | Agora exigem `CADASTRO_USUARIOS_BOTAO_CADASTRAR`, `CADASTRO_USUARIOS_LISTA_BOTAO_EDITAR` e `CADASTRO_USUARIOS_LISTA_BOTAO_RESETAR_SENHA` respectivamente. As rotas de troca da **própria** senha (`PUT /usuarios/reset-senha`, `PUT /usuarios/reset-senha/:login`) continuam sem tag — não são a mesma ação que resetar a senha de terceiro |
| 35 | [src/grupoPermissao/grupoPermissao.controller.ts](src/grupoPermissao/grupoPermissao.controller.ts) | `POST/PUT /grupo-permissoes` abertos a qualquer autenticado | Agora exigem `CADASTRO_GRUPO_PERMISSOES_BOTAO_CADASTRAR`/`_LISTA_BOTAO_EDITAR` |
| 36 | [src/baixa/baixa.controller.ts](src/baixa/baixa.controller.ts) | `PUT /baixa` e `DELETE /baixa/:id` abertos a qualquer autenticado | Agora exigem `AGENDA_BAIXA_UPDATE`/`AGENDA_BAIXA_DELETE` |
| 37 | [src/paciente/paciente.controller.ts](src/paciente/paciente.controller.ts) | `DELETE /paciente/:id` e `PUT /paciente/desabilitar` abertos a qualquer autenticado | Ambos agora exigem `CADASTRO_PACIENTES_LISTA_BOTAO_EXCLUIR` |
| 38 | [src/user/user.service.ts](src/user/user.service.ts) — `findUserAuth`/`getUser` | **Bug real encontrado no processo, fora do que foi pedido**: `user.permissoes = user.grupo.permissoes` quebrava (`TypeError`) para qualquer usuário com `grupoPermissaoId` nulo. Conferi no banco real: **muitos usuários ativos hoje têm `grupo: null`** (`tati.granado`, `larissa.lima`, `alda.carrara`, `caroline.viana` e outros). Como `AuthService.validateUser` engole qualquer erro e retorna "login inválido", **esses usuários provavelmente não conseguem logar mesmo com a senha certa**, e isso nunca apareceu como erro — só como "login e/ou senha inválido" | `user.permissoes = user.grupo?.permissoes \|\| []` nos dois pontos — usuário sem grupo passa a logar normalmente e ser tratado como "sem permissão nenhuma" (bloqueado pelo `PermissionsGuard` nas rotas com tag, liberado nas sem tag), em vez de não conseguir logar |

**Observação sobre os dados reais (não é bug de código, é configuração)**: os grupos `RECEPCAO` e `RECEPCAO BASICO` têm hoje exatamente as mesmas tags perigosas que `ADM` — incluindo resetar senha de terceiro e criar/editar grupo de permissão. O `PermissionsGuard` preserva esse comportamento (é o que está configurado no banco); se não for intencional, é uma mudança de dados em `GrupoPermissaoOnPermissao`, não uma correção de código, e não fiz essa mudança sem você confirmar.

**Continua fora do escopo**: as demais rotas de agenda e dos outros cadastros (modalidade, status-eventos, frequência, função, localidade, programa) têm tags equivalentes disponíveis no catálogo e poderiam ser protegidas com o mesmo padrão — não fiz por conta própria para não arriscar travar fluxo de trabalho de grupos sem revisão sua tag a tag. `permissao`/`perfil` (CRUD dos próprios cadastros de permissão/perfil) não têm tag correspondente no catálogo atual.

---

## 10. Plano de correção (etapas restantes)

Numeração e prioridades mantidas do diagnóstico original. Itens 3 e 4 (Agenda e Recorrência) foram, na prática, concluídos nesta sessão — mantidos na lista só com o resíduo que sobrou. Item 2 não se aplica mais no que era "N:N de terapeuta" (regra de 1 especialidade confirmada correta), reduzido ao que falta.

1. **Segurança e integridade** (Prioridade: Máxima) — ⚠️ **parcial**: identidade via JWT (agenda/usuários/sessão/baixa) e status/mensagem reais em toda resposta de erro (`responseError`/filtro global) já corrigidos. Ainda faltam: guard de permissão por tag, reset de senha seguro (exige permissão + senha não previsível), whitelist de mass assignment (`grupoPermissaoId`/`perfilId`). Todos dependem da definição do catálogo de permissões (§11 item 4).
2. **Cadastros e relacionamentos** (Alta) — ⚠️ **parcial**: jornada 8h–20h validada no agendamento, `perfilId` validado contra a tabela. Ainda faltam: `@unique` em `Paciente.carteirinha`/nomes de cadastro, exclusão condicionada a uso (hoje é hard delete direto nos cadastros auxiliares), enum fixo dos 4 papéis (hoje `Perfil` é tabela livre + 1 ID mágico hardcoded).
3. ~~**Agenda**~~ — ✅ **concluído**: conflito de horário, jornada, vínculo especialidade/terapeuta/função, trava de campos pós-criação, bloqueio de evento passado (com Atestado + tolerância de 2h), rota `/especialidade` (prefixo `/api` + endpoint `getAll` faltante) — tudo implementado e testado.
4. ~~**Recorrência**~~ — ✅ **concluído**: "esta e as próximas" agora divide a série corretamente sem tocar o passado. "Exigir fim de recorrência" **não se aplica** — decisão de negócio confirmada de que série sem fim é o comportamento esperado (§11 item 1).
5. **Filas** (Alta) — ⚠️ **parcial**: bug do `switch`/fallthrough corrigido. Ainda falta `prisma.$transaction` real nas transições avaliação→devolutiva→terapia (hoje é `Promise.all`, sem atomicidade) e idempotência.
6. **Baixas** (Média-alta) — ⚠️ **parcial**: duplicidade agora sinalizada (não mais silenciosa). Ainda faltam: soft delete com motivo/auditoria, `@@unique(eventoId)` a nível de banco.
7. ~~**Financeiro — precisão decimal e valores hardcoded**~~ — ✅ **concluído**: `valor`/`comissao`/`km` migrados para `Decimal(10,2)` no banco real (dado existente normalizado, sem perda); valor/km e valor de devolutiva agora configuráveis por env var. **Financeiro — snapshot** segue **não iniciado**: o cálculo ainda lê o valor atual do cadastro, não um valor congelado no momento do evento.
8. **Testes** (Alta, em paralelo) — ⚠️ **parcial**: 35 testes novos nesta sessão (agenda, `responseError`, feriados, baixa). Ainda faltam: e2e, transição de fila, financeiro, concorrência, isolamento entre clínicas — cobrindo os 15 cenários mínimos do enunciado.
9. **Performance** (Média) — ⚠️ **parcial**: teto de `pageSize` (100) já aplicado em todos os endpoints paginados. Ainda faltam índices em `Calendario`/`Baixa`.
10. ~~**Observabilidade**~~ — ✅ **concluído**: log estruturado de toda requisição/erro via interceptor + filtro globais (`LoggingInterceptor`, `AllExceptionsFilter`). Não inclui integração com ferramenta de APM externa (Sentry/Datadog/etc.) nem substituição de todo `console.log` disperso nos services.
11. **Migrations/Seeds** (Alta, novo) — ⚠️ **parcial**: seed de 18 tabelas de cadastro real criado ([prisma/seed.ts](prisma/seed.ts)), idempotente. Ainda falta adotar `prisma migrate` (histórico de schema versionado) — o projeto continua em `db push`.

---

## 11. Decisões de negócio pendentes

### Resolvidas nesta sessão

1. ~~Recorrência sem data final — precisa de regra de encerramento.~~ **Resolvido**: é o comportamento esperado (paciente ainda em atendimento); não é tratado como erro, nenhuma trava foi adicionada.
2. ~~Significado exato de "um dia de antecedência".~~ **Resolvido**: 48 horas corridas até o início do evento.
3. ~~Edição de paciente/especialidade/terapeuta/função/local em evento já existente — quais campos podem mudar.~~ **Resolvido**: paciente, especialidade, terapeuta, função, local, status e observação podem mudar; modalidade, data, horário, frequência, intervalo e dias da semana nunca mudam (mantidos do original, silenciosamente).
4. ~~Autorização por tag agora ou depois.~~ **Resolvido**: implementada nas rotas de maior risco assim que o catálogo real de tags apareceu no seed (rodada 4) — usuários, grupo-permissão, baixa, exclusão de paciente. As demais rotas (agenda, outros cadastros) têm tags disponíveis no catálogo mas não foram protegidas ainda — extensão possível com o mesmo padrão, sob pedido.
5. ~~Lista exata de status permitidos para evento passado.~~ **Resolvido**: apenas **Atestado**. Implementado em `assertStatusPermitidoParaEventoPassado` ([src/agenda/agenda.service.ts](src/agenda/agenda.service.ts)) — qualquer outra tentativa de mudança de status em evento já ocorrido (Atendido, Falta, Cancelado com/sem Antecedência etc.) é rejeitada.
6. ~~Conflito dessa regra com o check-in mobile (`PUT /evento/check`, marca Atendido).~~ **Resolvido**: definida uma tolerância de **2 horas após o horário final** do evento durante a qual ele ainda não é considerado "passado" — dentro dessa janela, o evento se comporta normalmente (qualquer status, inclusive Atendido, pode ser aplicado). Só depois de 2h do término é que a trava "somente Atestado" passa a valer. Implementado em `isEventoPassado` via a constante `TOLERANCIA_EVENTO_PASSADO_HORAS`.

### Decisão tomada por mim nesta sessão (avise se não era o que você queria)

13. **Escopo do seed** ([prisma/seed.ts](prisma/seed.ts)) — você pediu "todos os dados do banco atual, exceto agendamento e filas". Além disso, **excluí `Usuario`, `Terapeuta`, `TerapeutaOnFuncao`, `Paciente` e `PacienteHistorico`** por conta própria: são dados de pessoas reais (nome, telefone, hash de senha de login) e colocar isso num arquivo `.ts` versionado no git exporia essa informação permanentemente no histórico do repositório — o mesmo tipo de problema que já tínhamos com o `.env` (§4 Altos). Se você realmente quer usuários/terapeutas/pacientes no seed, me avise explicitamente; não vou incluir PII de novo sem confirmação, mesmo que peça "todos os dados".

### Ainda pendentes

14. Critério exato para "avaliação concluída" (agendado vs. realizado; "~3 atendimentos" é limite rígido ou informativo?) — hoje `VagaService.verifyInFila` considera concluído quando todas as especialidades estão com `agendado=true`, não quando a sessão foi de fato realizada.
15. Exclusão de séries recorrentes — suportar "só esta"/"esta e as próximas" além de "toda a série" (hoje `delete()` sempre remove a série inteira e passou a bloquear evento passado, mas não ganhou granularidade de escopo).
16. Atualização retroativa de valores/comissão — congelar snapshot (recomendado) ou permitir reprocessamento explícito. A precisão decimal já foi corrigida; falta decidir e implementar o snapshot em si.
17. Relação entre Baixa e status "Atendido" — baixa deve existir para todo status cobrável (comportamento atual) ou só para "Atendido"?
18. Quem pode excluir/editar evento criado por outro usuário (hoje só o criador consegue excluir — comportamento inalterado nesta sessão).
19. Whitelist de `grupoPermissaoId`/`perfilId` dentro do corpo de `POST/PUT /usuarios` — a rota agora exige permissão pra ser chamada (item 4 resolvido), mas quem tem a permissão ainda pode setar qualquer `grupoPermissaoId`/`perfilId` sem checagem adicional (ex.: "só ADM pode promover outro usuário a ADM"). Senha de reset continua sempre `'12345678'`, previsível.
20. Rotação de credenciais reais expostas no histórico do git (`.env`: banco, JWT, sessão) — preciso que você faça isso na sua ponta (não tenho acesso ao painel da hospedagem); ver §4 Altos.
21. **`RECEPCAO` e `RECEPCAO BASICO` têm hoje as mesmas tags perigosas que `ADM`** no banco real (resetar senha de terceiro, criar/editar grupo de permissão, editar/excluir usuário) — descoberto ao implementar o `PermissionsGuard` (§9 rodada 4). É dado de `GrupoPermissaoOnPermissao`, não bug de código; o guard só passou a *aplicar* o que já estava configurado. Se não for intencional, precisa de uma decisão sua sobre quais tags cada grupo deveria ter — não mexi nisso sozinho.

---

*Relatório gerado e atualizado por auditoria assistida. Quatro rodadas de correção aplicadas e verificadas nesta mesma sessão (`tsc --noEmit`, `nest build`, `npx jest` — 73/73 passando).*
