export const getPrismaClient = (prismaService: any) =>
  prismaService.getPrismaClient();

// Item 6 do pedido do front (heron-list-web): contrato de escrita único
// pra campos de dropdown — a API passa a aceitar tanto o id cru quanto o
// objeto completo do componente de dropdown ({id, nome, ...}), extraindo
// o id sozinha. Antes, cada tela do front tinha sua própria heurística
// pra fazer essa tradução antes de mandar (util/forms.ts,
// templates/crudSimples/index.tsx, pages/Financial.tsx, util/api.ts —
// 4 implementações levemente diferentes, todas assumindo "campo termina
// em Id" como sinal). Reaplica exatamente esse mesmo sinal aqui, do lado
// do servidor, pra não depender mais do cliente adivinhar certo — só
// mexe em campos cujo nome termina em "Id"; qualquer outro campo (JSON,
// texto, array, etc.) passa direto, sem tocar.
const extractDropdownValue = (key: string, value: unknown) => {
  if (
    key.endsWith('Id') &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'id' in (value as Record<string, unknown>)
  ) {
    return (value as Record<string, unknown>).id;
  }

  return value;
};

export const buildCreatePayload = (body: any, fields: string[] = []) => {
  if (!fields.length) return body;

  return Object.keys(body || {}).reduce((acc, key) => {
    if (fields.includes(key)) {
      acc[key] = extractDropdownValue(key, body[key]);
    }
    return acc;
  }, {} as any);
};
