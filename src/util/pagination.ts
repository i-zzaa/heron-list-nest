export const buildPagination = (
  page: number,
  pageSize: number,
  totalItems: number,
) => ({
  currentPage: page,
  pageSize,
  totalPages: Math.ceil(totalItems / pageSize) || 1,
});
