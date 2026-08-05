export const toNumberId = (value: unknown) => Number(value);

export const normalizeUpperCase = (value?: string) =>
  value ? value.toUpperCase() : value;

/**
 * Normaliza um valor monetário vindo do cliente para um número limpo,
 * seguro para gravar em coluna `Decimal` do Prisma. Aceita os formatos que
 * o frontend historicamente enviou: número puro, "200", "200,00",
 * " 200,00" (com espaço) e "R$ 200,00". Sempre usar isso (nunca
 * `.split('R$')[1]` nem `.replace(',', '.')` direto) antes de escrever em
 * `VagaOnEspecialidade.valor`, `TerapeutaOnFuncao.comissao` ou
 * `Calendario`/`VagaOnEspecialidade.km`.
 */
export const normalizeCurrencyValue = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const semMoeda = String(value).replace(/R\$/g, '').trim();
  const normalized = semMoeda.replace(',', '.');
  const parsed = parseFloat(normalized || '0');

  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Lê um campo `Decimal` do Prisma (ou qualquer valor legado ainda como
 * string/number) como `number` puro, sem depender da conversão implícita
 * do `Decimal` do decimal.js (que não implementa `.replace`/coerção segura
 * para `Number()` em todos os casos). Usar sempre que ler
 * `valor`/`comissao`/`km` vindos do banco para fazer conta.
 */
export const readDecimal = (value: unknown): number => {
  if (value === null || value === undefined) return 0;

  if (
    typeof value === 'object' &&
    typeof (value as { toNumber?: () => number }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return normalizeCurrencyValue(value);
};
