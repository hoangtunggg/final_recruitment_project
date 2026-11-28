/**
 * Tolerant readers for GET /applications, shared by the admin and employer workspaces. Depending on the deployment
 * the list is either `{ data: [...], pagination: { page, pages, total } }` (legacy monolith) or
 * `{ data: { applications: [...], pagination: { currentPage, limit } } }` (microservices: no total / page count).
 */
export const extractApplications = (response) => {
  if (!response?.success) return [];
  if (Array.isArray(response.data)) return response.data;
  return Array.isArray(response.data?.applications) ? response.data.applications : [];
};

/** Total from pagination metadata, or null when the API does not send one. */
export const extractTotal = (response) => {
  const total = response?.pagination?.total ?? response?.data?.pagination?.total;
  return typeof total === "number" ? total : null;
};

/**
 * Page state for a list request. Without a page count from the API, "there is a next page" is inferred from a full
 * page (list.length === limit); the total then counts only what has been seen so far.
 */
export const extractPagination = (response, { page, limit }) => {
  const meta = response?.pagination ?? response?.data?.pagination ?? {};
  const list = extractApplications(response);
  const currentPage = meta.page ?? meta.currentPage ?? page;
  const total = extractTotal(response);
  const knownPages = meta.pages ?? meta.totalPages ?? (total != null ? Math.max(1, Math.ceil(total / limit)) : null);
  const hasNext = knownPages != null ? currentPage < knownPages : list.length >= limit;
  return {
    currentPage,
    totalPages: knownPages ?? (hasNext ? currentPage + 1 : currentPage),
    totalApplications: total ?? (currentPage - 1) * limit + list.length,
    hasNext,
    hasPrev: currentPage > 1,
  };
};
