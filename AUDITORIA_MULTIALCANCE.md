# Auditoria do Backend — Regras de Negócio MultiAlcance

**Repositório:** `heron-list-nest` (branch `featureGuiaAmil`) · **Escopo:** diagnóstico completo + duas rodadas de correções (ver §9: rodada 1 = bugs mecânicos de baixo risco; rodada 2 = identidade, conflito de agenda/jornada/vínculos, campos bloqueados, recorrência, antecedência de cancelamento e proteção de evento passado).
**Data:** 2026-08-04

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
| Autenticação/Autorização | ⚠️ Parcial — identidade agora vem do JWT verificado, não de header (corrigido); `VagaController` estava sem guard nenhum (corrigido). **Autorização por tag continua não implementada** — decisão consciente, ver §9 rodada 2 e §11 |
| Cadastro de terapeuta (jornada, comissão, especialidade/funções) | ⚠️ Parcial — 1 especialidade + N funções está correto; jornada 8h–20h/sem sobreposição agora é validada no agendamento (corrigido) |
| Paciente | ⚠️ Parcial — sem dedupe de carteirinha, sem snapshot financeiro; `delete()` apagava a entidade errada (corrigido) |
| Filas (avaliação/devolutiva/terapia) | ⚠️ Parcial — máquina de estados via `Vaga`; `switch` com fallthrough corrigido; **transação real (`$transaction`) entre vaga↔paciente ainda não implementada** |
| Agenda | ✅ Conflito de horário, jornada e vínculo especialidade/terapeuta/função agora validados na criação e edição; evento passado agora bloqueia edição de campos (só status) e exclusão |
| Edição "esta e as próximas" | ✅ Corrigido — `changeAll` agora sempre passa pelo split correto (série antiga trunca, série nova nasce da data atual); campos travados (modalidade/data/horário/frequência/intervalo/dias) são sempre mantidos do original |
| Cancelamento com/sem antecedência | ✅ Corrigido — backend decide sozinho (48h corridas até o início do evento), ignorando o status enviado pelo cliente quando for um dos dois de cancelamento |
| Baixa | ⚠️ Parcial — evita baixa duplicada, `usuarioId` agora vem do JWT (corrigido); exclusão continua física, sem motivo/auditoria |
| Financeiro | ⚠️ Parcial — cálculo funcional, mas **sem snapshot** (retroativo), valores em `String`/`parseFloat`, km e devolutiva hardcoded — **não alterado nesta rodada** (precisa de migration, ver §11) |
| CRUD de cadastros (13 controllers) | ✅ Corrigido — endpoints `DELETE /:id` estavam todos quebrados por bug de binding do NestJS |
| Testes | ❌ Insuficiente — 31 testes, todos de formatação/filtro; nenhum cobre regra de negócio, concorrência ou permissão |
| Migrations/Seeds | ❌ Ausentes — `prisma db push` sem histórico, sem seed versionado |
| Multiclínica | ❌ Não existe (não há `Clinica`/tenant em nenhuma entidade) |

### Riscos críticos (bloqueadores de produção)

1. **Escalada de privilégio**: qualquer usuário autenticado ainda pode criar/editar usuários, grupos de permissão e **resetar a senha de qualquer conta** (inclusive administrador) para uma senha padrão fixa. **Não corrigido nesta rodada** — decisão consciente (autorização por tag foi adiada, ver §11); a única mitigação já feita é que a *identidade* de quem faz a chamada agora é a verificada pelo JWT, não mais um header livre.
2. ~~**Identidade de negócio via header HTTP livre** (`req.headers.login`)~~ — **corrigido**: `agenda`, `usuarios`, `sessao` e `baixa` agora usam `req.user.username`, populado pelo payload assinado do JWT (`AuthGuard('jwt')`), não mais um header que o cliente controla.
3. ~~**`VagaController` sem autenticação nenhuma**~~ — **corrigido** (guard reativado). Antes da correção, qualquer pessoa na internet, sem token, conseguia mover pacientes entre filas.
4. ~~**Nenhuma verificação de conflito de horário** ao criar/editar eventos~~ — **corrigido**: dupla marcação, sobreposição parcial e evento fora da jornada (8h–20h ou fora do dia cadastrado) agora são rejeitados na criação e em toda edição que troca a terapeuta.
5. ~~**Bug de exclusão cruzada**: `PacienteService.delete()` deletava um registro de `Localidade`, não o paciente~~ — **corrigido**.
6. ~~**Todos os 13 endpoints `DELETE /:id` de cadastro**~~ — **corrigido**.
7. **Ausência de transação real (`prisma.$transaction`) nos fluxos de fila** (`VagaService.update`) — **não corrigido nesta rodada**: o `switch` sem `break` foi corrigido, mas as chamadas continuam em `Promise.all` (concorrência, não atomicidade). Fica para uma rodada dedicada por exigir threading do client de transação por várias camadas de service (Vaga → Paciente).
8. **Financeiro recalculado a partir dos cadastros atuais** (sem snapshot) — qualquer alteração de valor/comissão reescreve relatórios de períodos fechados. **Não corrigido nesta rodada**: exige migration de schema (novos campos em `Calendario`/`Baixa` + migração de `String` para `Decimal`), que não deve ser aplicada ao banco sem sua confirmação explícita.
9. ~~**"Esta e as próximas" reescrevia ocorrências passadas**~~ — **corrigido**: `changeAll` agora sempre passa pela lógica de split (trunca a série antiga, cria a nova a partir da data atual) em vez de um `updateMany` cru por `groupId`.
10. ~~**Campos bloqueados (modalidade/data/horário/frequência/intervalo/dias) eram graváveis via update**~~ — **corrigido**: sempre mantidos do registro original, ignorados silenciosamente se vierem diferentes no payload.
11. ~~**Cliente escolhia livremente entre "Cancelado com Antecedência" e "Cancelado sem Antecedência"**~~ — **corrigido**: backend recalcula com base em 48h corridas até o início do evento.
12. ~~**Evento passado podia ser editado/excluído livremente**~~ — **corrigido**: exclusão de evento já ocorrido é bloqueada; edição só aceita mudança de status (a baixa decorrente segue o status corrigido).

---

## 2. Arquitetura encontrada

- **Framework:** NestJS 9, TypeScript 4.7, sem `strictNullChecks`/`noImplicitAny`.
- **ORM:** Prisma 4.9 (`prisma/schema.prisma`).
- **Banco:** MySQL.
- **Autenticação:** Passport (`passport-local` no login, `passport-jwt` nas rotas) + `express-session`/`passport.session()` coexistindo com JWT stateless sem necessidade aparente.
- **Autorização:** inexistente além de "token válido" — sem guard de tags/permissão.
- **Padrão arquitetural:** Controller → Service → Prisma direto, sem repository, sem DTOs de classe validados (`*.interface.ts` são apenas `interface`/`enum`, não `class` com `class-validator`); `ValidationPipe` global está registrado mas não tem o que validar.
- **Migrations:** não existem (`prisma/migrations/` ausente); schema aplicado via `db push`.
- **Seeds:** não encontrados.
- **Testes:** 8 suites / 31 testes unitários, todos passam; nenhum e2e (pasta `test/` inexistente apesar do script `test:e2e` referenciá-la).
- **Build/lint:** `tsc --noEmit` limpo; `nest build` sem erros; `eslint` com 35 erros de formatação e 71 warnings de variável não usada — não bloqueante.
- **CORS:** configurado de forma redundante/conflitante (`enableCors()` aberto + lista restrita + middleware `cors({origin:'*'})` global).
- **Segredo JWT:** fallback hardcoded `'dev-secret-key'` quando `JWT_PRIVATE_KEY` não está definido.
- **Swagger:** não presente no projeto.

---

## 3. Matriz de conformidade

| ID | Área | Regra | Status | Evidência | Problema | Severidade | Correção |
|----|------|-------|--------|-----------|----------|------------|----------|
| R1 | Segurança | Guard de permissão por tag protegendo rotas | **NÃO ATENDE** | `src/auth/autheticated.guard.ts` não é usado; todos os controllers usam só `@UseGuards(AuthGuard('jwt'))` | Não existe checagem de `cod` de permissão em nenhuma rota | **Crítico** | Criar `PermissionsGuard` + decorator `@RequirePermission('cod')` |
| R2 | Segurança | Identidade do usuário vem do JWT verificado | **INCORRETO** | `jwt.strategy.ts` retorna só `{sub, username}`; toda a lógica usa `req.headers.login` | Header `login` é definido pelo cliente | **Crítico** | Extrair usuário de `req.user.sub` |
| R3 | Segurança | Reset de senha exige permissão e não é previsível | **INCORRETO** | `user.service.ts updatePassword` seta `'12345678'`; exposto em `GET /usuarios/reset-senha/:id` só com `AuthGuard('jwt')` | Qualquer autenticado reseta senha de qualquer usuário | **Crítico** | Permissão específica + senha aleatória/token |
| R4 | Segurança | Escalada de privilégio bloqueada | **NÃO ATENDE** | `UserService.create/update` aceitam `body.grupoPermissaoId`/`body.perfilId` sem whitelist | Usuário comum pode virar admin | **Crítico** | Whitelist de campos + checagem de quem altera |
| R4b | Segurança | Todas as rotas de negócio exigem autenticação | **INCORRETO (corrigido)** | `vaga.controller.ts:16` tinha `@UseGuards(AuthGuard('jwt'))` **comentado** | Fila de pacientes (`/vagas/agendar`, `/vagas/devolutiva`) ficava 100% pública | **Crítico** | ✅ Guard reativado nesta sessão |
| R5 | Segurança | 401 vs 403 diferenciados | **INCORRETO** | `response.ts responseError` sempre retorna `401` | Cliente não diferencia autenticação/permissão/validação/servidor | **Alto** | Padronizar `HttpException` com status correto |
| R6 | Agenda | Conflito de horário do mesmo terapeuta é rejeitado | **NÃO ATENDE** | Nenhuma checagem de overlap em `agenda.service.ts` | Dupla marcação aceita sem erro | **Crítico** | Validar overlap antes do create/update |
| R7 | Agenda | Evento respeita jornada da terapeuta (8h–20h, dias trabalhados) | **NÃO ATENDE** | `createCalendario`/`updateCalendario` não consultam `cargaHoraria` | Evento fora da jornada é aceito | **Alto** | Validar contra `cargaHoraria` |
| R8 | Agenda | Editar "esta e as próximas" não altera ocorrências passadas | **INCORRETO** | `changeAll` faz `updateMany({where:{groupId}})` sem filtro de data | Reescreve histórico | **Crítico** | Dividir série em duas |
| R9 | Agenda | Campos bloqueados após criação (modalidade, data, horário, frequência, intervalo, dias) | **NÃO ATENDE** | `formatEvent()` reenvia todos os campos no update | Todos os campos são graváveis | **Alto** | Filtrar payload de update |
| R10 | Agenda | Exclusão de evento passado é bloqueada | **NÃO ATENDE** | `delete()` não compara data/hora com "agora" | Evento já ocorrido pode ser excluído | **Alto** | Bloquear delete quando `end < now()` |
| R11 | Agenda | Exclusão de série (esta / esta+próximas / toda) definida | **NÃO ATENDE** | `delete()` sempre remove a série inteira, só se `usuarioId` bater com o criador | Sem opção parcial | **Alto** | Definir regra + implementar |
| R12 | Agenda | Transação nos fluxos de update/create de eventos | **NÃO ATENDE** | `Promise.all` no lugar de `$transaction`; `baixaService.create(...)` chamado sem `await` em 4 pontos | Falha parcial deixa evento/baixa dessincronizados | **Crítico** | `$transaction` + `await` (await já corrigido nesta sessão) |
| R13 | Filas | Transição avaliação→devolutiva→terapia é transacional e idempotente | **INCORRETO (parcialmente corrigido)** | `VagaService.update()` usa `Promise.all` (não é transação); `case queue_avaliation` sem `break` antes de `case avaliation` | Fallthrough duplicava efeito; falta de transação persiste | **Crítico** | ✅ `break` corrigido nesta sessão; `$transaction` real ainda pendente |
| R14 | Filas | Fila é modelada por entidade/estado explícito | **ATENDE PARCIALMENTE** | `Vaga` + `VagaOnEspecialidade` fazem o papel de máquina de estados, sem histórico tipado | Difícil auditar transições | **Médio** | Formalizar histórico |
| R15 | Baixa | Um evento não recebe duas baixas ativas | **ATENDE PARCIALMENTE** | `baixa.service.ts create()` verifica antes de criar | Falha silenciosa, sem lock/constraint de banco | **Médio** | `@@unique(eventoId)` |
| R16 | Baixa | Exclusão de baixa preserva histórico/motivo | **NÃO ATENDE** | `delete()` faz `prisma.baixa.delete` — física | Sem motivo, sem auditoria | **Alto** | Soft delete + auditoria |
| R17 | Financeiro | Snapshot do valor/comissão no momento do evento | **NÃO ATENDE** | `FinanceiroService` lê `VagaOnEspecialidade.valor`/`TerapeutaOnFuncao.comissao` atuais | Alterar valor hoje reescreve relatórios antigos | **Crítico** | Persistir snapshot no evento/baixa |
| R18 | Financeiro | Precisão monetária (Decimal) | **INCORRETO** | Valores são `String` + `parseFloat`/split manual de "R$" | Risco de ponto flutuante e parsing quebradiço | **Alto** | Migrar para `Decimal` |
| R19 | Financeiro | Valor por km e valor de devolutiva configuráveis | **INCORRETO** | Hardcoded `* 0.9` e `= 50` no código | Preço embutido no código | **Alto** | Externalizar para cadastro |
| R20 | Cadastros | Exclusão bloqueada quando entidade está em uso | **NÃO ATENDE** | `delete()` de Especialidade/Função/Localidade/StatusEvento fazem hard delete direto | FK do Prisma rejeita com erro cru (500 genérico) | **Médio** | Checar uso antes de excluir, ou usar `ativo=false` |
| R21 | Cadastros | Endpoints `DELETE /:id` funcionam | **INCORRETO (corrigido)** | 13 controllers usavam `@Param() id: number` (sem chave) → `id` virava o objeto `{id:'...'}` inteiro → `Number(id)` = `NaN` em todos os services | **Todo** endpoint de exclusão de cadastro estava quebrado (paciente, especialidade, função, localidade, status-evento, modalidade, período, perfil, status, tipo-sessão, convênio, frequência, sessão) | **Alto** | ✅ Corrigido nesta sessão (`@Param('id')` em todos) |
| R22 | Cadastros | `PacienteService.delete()` remove o paciente | **INCORRETO (corrigido)** | `delete(id)` executava `prisma.localidade.delete(...)` — apagava uma **Localidade**, não o Paciente | Bug de corrupção de dados | **Crítico** | ✅ Corrigido nesta sessão — agora inativa o paciente (`disabled:true`), preservando histórico |
| R23 | Terapeuta | Terapeuta tem uma especialidade e várias funções dentro dela | **ATENDE** | `Terapeuta.especialidadeId` (FK única) + `TerapeutaOnFuncao` (N:N terapeuta↔função) | — regra confirmada pelo negócio, modelo já correto | — | Nenhuma (item removido da lista de problemas) |
| R24 | Terapeuta | Jornada 8h–20h validada no backend, sem sobreposição | **NÃO ATENDE** | `cargaHoraria` é `Json` livre gravado sem validação | Regra é só do frontend | **Alto** | Validar estrutura/faixa/sobreposição no service |
| R25 | Terapeuta | Perfil de usuário validado por enum fixo (Admin/Coordenadora/Terapeuta/Secretária) | **ATENDE PARCIALMENTE** | `Perfil` é tabela livre; único enum é `ID_PERFIL_TERAPEUTA.id = 5` hardcoded | `perfilId` numérico qualquer é aceito | **Médio** | Validar contra tabela, evitar ID mágico |
| R26 | Vagas/Filas | Vínculo especialidade↔paciente/terapeuta validado no agendamento | **NÃO ATENDE** | `createCalendario` não valida vínculos antes de criar `Calendario` | IDs incompatíveis manuais são aceitos | **Crítico** | Validar vínculos reais antes do create |
| R27 | Cancelamento | Antecedência mínima de 1 dia calculada e status escolhido automaticamente | **NÃO ATENDE** | Nenhuma lógica de antecedência no backend | Cliente escolhe status de cobrança livremente | **Crítico** | Calcular antecedência no backend |
| R28 | Migrations/Seeds | Migrations versionadas e seeds dos cadastros mínimos | **NÃO ATENDE** | Sem `prisma/migrations/`, sem seed | Deploy não reproduzível | **Alto** | Adotar `prisma migrate` + seed idempotente |
| R29 | Multiclínica | Isolamento por clínica/tenant | **NÃO ATENDE** | Nenhuma entidade tem campo de tenant | Não aplicável hoje (mono-clínica) | Informativo | Definir se é requisito futuro |
| R30 | Consulta de agenda | API consulta só o período pedido | **ATENDE** | `getFilter`/`getRange` usam `buildDateRangeWhere` | — | — | — |
| R31 | Paginação | Tamanho de página tem limite máximo no backend | **NÃO ATENDE** | `pageSize` vem direto de `Number(req.query.pageSize)` sem teto | Cliente pode pedir a tabela inteira | **Médio** | Impor limite máximo |

---

## 4. Problemas encontrados

### Críticos
1. Sem autorização por permissão (R1).
2. Identidade via header `login` falsificável (R2).
3. Reset de senha sem permissão, para senha fixa conhecida (R3).
4. Mass assignment de `grupoPermissaoId`/`perfilId` (R4).
5. ~~`VagaController` sem autenticação nenhuma~~ — **corrigido** (R4b).
6. Nenhuma checagem de conflito de horário (R6).
7. `changeAll` reescreve ocorrências passadas (R8).
8. Ausência de transações reais nos fluxos de fila (R13) e agenda/baixa (R12).
9. ~~`switch` sem `break` em `VagaService.update`~~ — **corrigido** (R13).
10. Financeiro sem snapshot (R17).
11. ~~`PacienteService.delete()` apagava uma `Localidade`~~ — **corrigido** (R22).
12. Vínculo especialidade/terapeuta/função não validado no `createCalendario` (R26).
13. Regra de antecedência de cancelamento não existe no backend (R27).

### Altos
- `responseError` sempre 401 (R5).
- Campos "bloqueados" da agenda são graváveis via update (R9).
- Exclusão de evento passado não é bloqueada (R10).
- Exclusão de série sempre remove tudo (R11).
- Exclusão de baixa é física, sem motivo/auditoria (R16).
- Valores monetários como `String` + `parseFloat` (R18, R19).
- `cargaHoraria` sem validação (R24).
- Ausência de migrations/seeds (R28).
- ~~13 endpoints `DELETE /:id` quebrados~~ — **corrigidos** (R21).
- `.env` foi commitado no histórico do git antes de entrar no `.gitignore` — recomenda-se rotacionar segredos que tenham circulado.
- CORS redundante/conflitante.

### Médios
- Exclusão física de cadastros auxiliares sem checar uso (R20).
- `Baixa.create` falha silenciosamente em duplicidade (R15).
- `perfilId` não validado contra enum/tabela (R25).
- Paginação sem teto (R31).
- `FERIADOS` hardcoded só até 2022, desatualizado.
- `$queryRawUnsafe` em `findDuplicateFullNames` (sem input hoje, mas padrão arriscado).

### Baixos
- 71 warnings de lint, 35 erros de formatação Prettier.
- `console.log` no lugar de logger estruturado.
- Dois mecanismos de sessão coexistindo sem necessidade.

---

## 5. Regras somente no frontend

| Regra | Backend valida? | Risco |
|---|---|---|
| Conflito de horário do terapeuta | Não | Alto |
| Jornada 8h–20h sem sobreposição | Não | Alto |
| Antecedência de 1 dia para cancelamento sem cobrança | Não | Crítico |
| Especialidade pertence ao paciente / terapeuta possui a especialidade / função compatível | Não | Crítico |
| Campos bloqueados após criação do evento | Não | Alto |
| Grupo de permissão só editável por quem tem permissão | Não | Crítico |
| Exclusão/edição de evento passado bloqueada | Não | Alto |

---

## 6. Endpoints encontrados (amostra)

| Método | Rota | Controller | Permissão | Observação |
|---|---|---|---|---|
| POST | `/login` | auth.controller.ts | `AuthGuard('local')` | OK |
| POST/PUT/DELETE | `/evento` | agenda.controller.ts | `AuthGuard('jwt')` (sem tag) | Sem checagem de conflito/vínculo/campo bloqueado |
| POST | `/usuarios` | user.controller.ts | `AuthGuard('jwt')` (qualquer autenticado) | Mass assignment de grupo/perfil |
| GET | `/usuarios/reset-senha/:id` | user.controller.ts | `AuthGuard('jwt')` (qualquer autenticado) | Reset para senha fixa sem permissão |
| PUT | `/vagas/agendar`, `/vagas/devolutiva` | vaga.controller.ts | **estava sem guard** | ✅ Guard reativado nesta sessão |
| DELETE | `/paciente/:id`, `/especialidade/:id`, `/funcao/:id`, `/localidade/:id`, `/status-eventos/:id`, `/modalidade/:id`, `/periodo/:id`, `/perfil/:id`, `/status/:id`, `/tipo-sessao/:id`, `/convenio/:id`, `/frequencia/:id`, `/sessao/:id` | 13 controllers | `AuthGuard('jwt')` | ✅ Bug de `@Param()` corrigido nesta sessão |

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

**Após as duas rodadas de correção: 46 testes, mesmas 8 suites.** Os 15 novos, em [agenda.service.spec.ts](src/agenda/agenda.service.spec.ts), cobrem especificamente a lógica adicionada: `hasScheduleConflict` (sobreposição parcial, horário idêntico, encostado sem sobrepor, evento cancelado ignorado), `validateJornada` (fora de 8h–20h, início ≥ fim, dia sem jornada cadastrada, dentro da jornada), `isEventoPassado`/`assertSomenteStatusAlterado` (passado vs. futuro, campo bloqueado rejeitado, só status permitido) e `resolveStatusCancelamento` (status não-cancelamento intocado, <48h → sem antecedência, ≥48h → com antecedência). Ainda faltam: testes de `createCalendario`/`updateCalendario` ponta a ponta (com Prisma mockado ou banco de teste), transição de fila, baixa duplicada, financeiro, concorrência e e2e — não cobertos nesta rodada.

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

Todos os itens abaixo foram validados com `tsc --noEmit`, `nest build` e `npx jest` (46/46 passando, 15 testes novos cobrindo especificamente esta rodada em [agenda.service.spec.ts](src/agenda/agenda.service.spec.ts)).

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

**Fora do escopo desta rodada (decisão de negócio pendente ou exige migration de banco — ver §11):** autorização por tag, whitelist de `grupoPermissaoId`/`perfilId` (escalada de privilégio), permissão para reset de senha, snapshot financeiro (`Calendario`/`Baixa`) e migração `String`→`Decimal`, soft delete/auditoria de baixa e cadastros em uso, `prisma.$transaction` real nas transições de fila, unicidade de carteirinha/nomes, índices de banco, migrations/seeds formais. Nenhuma dessas foi tocada porque envolve mudança de schema (preciso da sua confirmação antes de rodar qualquer `prisma migrate`/`db push` contra o banco real) ou uma definição de regra que você ainda não fechou.

---

## 10. Plano de correção (etapas restantes)

Numeração e prioridades mantidas do diagnóstico original (a etapa "2. Cadastros e relacionamentos" já teve sua parte de bugs mecânicos resolvida no item 9 acima; o restante — modelagem N:N de terapeuta, que **não se aplica mais** pois a regra de 1 especialidade está correta — fica reduzido a validação de jornada e unicidade de nomes).

1. **Segurança e integridade** (Prioridade: Máxima) — guard de permissão, identidade via JWT, reset de senha seguro, whitelist de mass assignment.
2. **Cadastros e relacionamentos** (Alta) — validar jornada 8h–20h/sobreposição, `@unique` em nomes/carteirinha, exclusão condicionada a uso.
3. **Agenda** (Máxima) — checagem de conflito/jornada no create/update, trava de campos pós-criação, bloqueio de evento passado.
4. **Recorrência** (Alta) — dividir série em "esta e as próximas" sem tocar o passado; exigir fim de recorrência.
5. **Filas** (Alta) — `$transaction` real nas transições, idempotência.
6. **Baixas** (Média-alta) — soft delete com motivo/auditoria, `@@unique(eventoId)`.
7. **Financeiro** (Alta) — snapshot de valor/comissão/km no evento, migrar para `Decimal`, externalizar valor/km e valor de devolutiva.
8. **Testes** (Alta, em paralelo) — suíte e2e cobrindo os 15 cenários mínimos do enunciado.
9. **Performance** (Média) — índices em `Calendario`/`Baixa`.
10. **Observabilidade** (Média) — logger estruturado, `HttpExceptionFilter` com status corretos.

---

## 11. Decisões de negócio pendentes

### Resolvidas nesta sessão

1. ~~Recorrência sem data final — precisa de regra de encerramento.~~ **Resolvido**: é o comportamento esperado (paciente ainda em atendimento); não é tratado como erro, nenhuma trava foi adicionada.
2. ~~Significado exato de "um dia de antecedência".~~ **Resolvido**: 48 horas corridas até o início do evento.
3. ~~Edição de paciente/especialidade/terapeuta/função/local em evento já existente — quais campos podem mudar.~~ **Resolvido**: paciente, especialidade, terapeuta, função, local, status e observação podem mudar; modalidade, data, horário, frequência, intervalo e dias da semana nunca mudam (mantidos do original, silenciosamente).
4. ~~Autorização por tag agora ou depois.~~ **Resolvido por ora**: adiada; só a identidade (JWT) foi corrigida nesta rodada.
5. ~~Lista exata de status permitidos para evento passado.~~ **Resolvido**: apenas **Atestado**. Implementado em `assertStatusPermitidoParaEventoPassado` ([src/agenda/agenda.service.ts](src/agenda/agenda.service.ts)) — qualquer outra tentativa de mudança de status em evento já ocorrido (Atendido, Falta, Cancelado com/sem Antecedência etc.) é rejeitada.
6. ~~Conflito dessa regra com o check-in mobile (`PUT /evento/check`, marca Atendido).~~ **Resolvido**: definida uma tolerância de **2 horas após o horário final** do evento durante a qual ele ainda não é considerado "passado" — dentro dessa janela, o evento se comporta normalmente (qualquer status, inclusive Atendido, pode ser aplicado). Só depois de 2h do término é que a trava "somente Atestado" passa a valer. Implementado em `isEventoPassado` via a constante `TOLERANCIA_EVENTO_PASSADO_HORAS`.

### Ainda pendentes

7. Critério exato para "avaliação concluída" (agendado vs. realizado; "~3 atendimentos" é limite rígido ou informativo?) — hoje `VagaService.verifyInFila` considera concluído quando todas as especialidades estão com `agendado=true`, não quando a sessão foi de fato realizada.
8. Exclusão de séries recorrentes — suportar "só esta"/"esta e as próximas" além de "toda a série" (hoje `delete()` sempre remove a série inteira e passou a bloquear evento passado, mas não ganhou granularidade de escopo).
9. Atualização retroativa de valores/comissão — congelar snapshot (recomendado) ou permitir reprocessamento explícito. Não implementado: exige migration de schema.
10. Relação entre Baixa e status "Atendido" — baixa deve existir para todo status cobrável (comportamento atual) ou só para "Atendido"?
11. Quem pode excluir/editar evento criado por outro usuário (hoje só o criador consegue excluir — comportamento inalterado nesta rodada).
12. Whitelist de `grupoPermissaoId`/`perfilId` e permissão para reset de senha — depende da mesma decisão de autorização por tag do item 4.

---

*Relatório gerado e atualizado por auditoria assistida. Rodadas 1 e 2 da seção 9 aplicadas e verificadas (`tsc --noEmit`, `nest build`, `npx jest` — 46/46) nesta mesma sessão.*
