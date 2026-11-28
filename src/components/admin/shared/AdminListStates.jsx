import { useTranslation } from "react-i18next";
import { FiAlertCircle } from "react-icons/fi";
import { Button, Card, Spinner } from "../../ui";

/** Card that wraps a table and its states; clips the table corners. */
export const AdminTableCard = ({ children }) => (
  <Card padding="none" shadow={false} className="overflow-hidden">
    {children}
  </Card>
);

/** Loading state. Props: text (translated, e.g. "Đang tải việc làm..."). */
export const AdminLoadingState = ({ text }) => (
  <div className="p-12 text-center text-primary-text">
    <Spinner size="md" label={text} className="mb-3" />
    <p className="text-sm text-muted" aria-hidden="true">
      {text}
    </p>
  </div>
);

/** Load failed. Props: title, message (server text shown as-is), onRetry. */
export const AdminErrorState = ({ title, message, onRetry }) => {
  const { t } = useTranslation("admin");
  return (
    <div className="p-12 text-center">
      <FiAlertCircle className="w-10 h-10 text-danger mx-auto mb-3" aria-hidden="true" />
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="text-sm text-danger mt-1 mb-4">{message}</p>
      <Button size="sm" onClick={onRetry}>
        {t("common:states.retry")}
      </Button>
    </div>
  );
};

/** Empty list. Props: icon (node), title, description, onClear (shows "clear filters" when given). */
export const AdminEmptyListState = ({ icon, title, description, onClear }) => {
  const { t } = useTranslation("admin");
  return (
    <div className="p-12 text-center">
      <span className="block text-4xl text-muted mx-auto mb-3" aria-hidden="true">
        {icon}
      </span>
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="text-sm text-muted mt-1 mb-4">{description}</p>
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          {t("common:actions.clearFilters")}
        </Button>
      )}
    </div>
  );
};
