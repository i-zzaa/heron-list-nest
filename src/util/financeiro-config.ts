// Parâmetros financeiros configuráveis por env var (antes hardcoded no meio
// do cálculo em financeiro.service.ts: `* 0.9` e `= 50`). Ficam num arquivo
// à parte (não em financeiro.service.ts) porque agenda.service.ts também
// precisa deles para gravar o snapshot financeiro do evento, e
// financeiro.service.ts já importa AgendaService — importar na direção
// contrária criaria um ciclo.
export const VALOR_POR_KM = Number(process.env.FINANCEIRO_VALOR_POR_KM) || 0.9;

export const VALOR_SESSAO_DEVOLUTIVA =
  Number(process.env.FINANCEIRO_VALOR_SESSAO_DEVOLUTIVA) || 50;
