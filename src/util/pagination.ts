export const MAX_PAGE_SIZE = 100;

// Impede que o cliente peça uma página maior que o teto (ex.: pageSize=999999
// para dumpar a tabela inteira). Usar sempre para normalizar o pageSize
// recebido via query/body antes de repassá-lo ao Prisma (skip/take).
export const normalizePageSize = (
  pageSize: number,
  maxPageSize: number = MAX_PAGE_SIZE,
) => {
  if (!pageSize || Number.isNaN(pageSize) || pageSize < 1) {
    return 10;
  }

  return Math.min(pageSize, maxPageSize);
};

// Envelope único pedido pelo front (heron-list-web, item 1 da
// especificação): antes essa função devolvia `currentPage` (não `page`)
// e nunca incluía o total de itens — cada tela do front tentava adivinhar
// o nome certo (page/currentPage, total/totalItems). Nomes fixos agora:
// page, pageSize, total, totalPages — sem variação entre endpoints.
export const buildPagination = (
  page: number,
  pageSize: number,
  totalItems: number,
) => ({
  page,
  pageSize,
  total: totalItems,
  totalPages: Math.ceil(totalItems / pageSize) || 1,
});
