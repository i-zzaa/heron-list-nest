export const toNumberId = (value: unknown) => Number(value);

export const normalizeUpperCase = (value?: string) =>
  value ? value.toUpperCase() : value;

export const normalizeCurrencyValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 0;

  const normalized = String(value).replace(',', '.');
  return parseFloat(normalized || '0');
};
