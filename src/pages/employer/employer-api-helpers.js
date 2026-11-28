/**
 * Tolerant readers for GET /applications. Depending on the deployment the list is either
 * `{ data: [...], pagination: { total } }` or `{ data: { applications: [...], pagination } }`.
 */
export const extractApplications = (response) => {
  if (!response?.success) return [];
  if (Array.isArray(response.data)) return response.data;
  return Array.isArray(response.data?.applications) ? response.data.applications : [];
};

/** Employer-scoped total from pagination metadata, or null when the API does not send one. */
export const extractTotal = (response) => {
  const total = response?.pagination?.total ?? response?.data?.pagination?.total;
  return typeof total === "number" ? total : null;
};

/**
 * Message worth showing verbatim: the server's `error` text. Transport failures (Axios "Network Error",
 * "Request failed with status code 500") return null so the caller shows its translated fallback instead.
 */
export const serverErrorText = (err) =>
  err?.response?.data?.error || (err?.isAxiosError ? null : err?.message) || null;
