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

export const buildPagination = (
  page: number,
  pageSize: number,
  totalItems: number,
) => ({
  currentPage: page,
  pageSize,
  totalPages: Math.ceil(totalItems / pageSize) || 1,
});
