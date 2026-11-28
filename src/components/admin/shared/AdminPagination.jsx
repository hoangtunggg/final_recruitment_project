import { useTranslation } from "react-i18next";
import { Button } from "../../ui";

/**
 * Footer of the admin tables.
 * Props: currentPage, totalPages, total, limit, noun (translated plural, e.g. "việc làm"),
 *        hasPrev, hasNext, loading, onPrev, onNext.
 */
const AdminPagination = ({
  currentPage,
  totalPages,
  total,
  limit,
  noun,
  hasPrev,
  hasNext,
  loading,
  onPrev,
  onNext,
}) => {
  const { t } = useTranslation("admin");
  return (
    <div className="px-6 py-4 bg-tint border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-muted">
        {t("shared.showing", {
          from: (currentPage - 1) * limit + 1,
          to: Math.min(currentPage * limit, total),
          total,
          noun,
        })}
      </div>
      <div className="inline-flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev || currentPage <= 1 || loading}
        >
          {t("common:actions.previous")}
        </Button>
        <span className="text-sm text-muted px-2">
          {t("shared.pageOf", { page: currentPage, pages: Math.max(1, totalPages) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || currentPage >= totalPages || loading}
        >
          {t("common:actions.next")}
        </Button>
      </div>
    </div>
  );
};

export default AdminPagination;
