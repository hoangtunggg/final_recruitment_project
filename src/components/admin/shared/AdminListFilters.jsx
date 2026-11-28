import { useTranslation } from "react-i18next";
import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import { Card } from "../../ui";

const CONTROL =
  "w-full min-h-11 rounded-control border border-line bg-surface text-ink text-sm focus:outline-none focus:border-primary-500 focus:shadow-focus";

/** Card that holds the search box and the filter selects (stacks on mobile, row from md). */
export const AdminFilterBar = ({ children }) => (
  <Card padding="sm" shadow={false}>
    <div className="flex flex-col md:flex-row gap-4">{children}</div>
  </Card>
);

/** Search input with leading icon and a clear button. Props: value, onChange(event), onClear, placeholder, testId. */
export const AdminSearchBox = ({ value, onChange, onClear, placeholder, testId }) => {
  const { t } = useTranslation("admin");
  return (
    <div className="flex-1 relative">
      <FiSearch
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4"
        aria-hidden="true"
      />
      <input
        type="text"
        data-testid={testId}
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={onChange}
        className={`${CONTROL} pl-10 pr-10 py-2 placeholder:text-muted/75`}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-control text-muted hover:text-ink hover:bg-tint"
          aria-label={t("shared.clearSearch")}
        >
          <FiX className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

/** Native select filter with chevron. Props: value, onChange(event), ariaLabel, className (width), children (<option>s). */
export const AdminFilterSelect = ({ value, onChange, ariaLabel, className = "md:w-48", children }) => (
  <div className={`w-full relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={`${CONTROL} appearance-none px-4 py-2 pr-9`}
    >
      {children}
    </select>
    <FiChevronDown
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none w-4 h-4"
      aria-hidden="true"
    />
  </div>
);
