import { useTranslation } from "react-i18next";
import { FaFilter, FaTimes } from "react-icons/fa";
import { Select } from "../../../components/ui";
import { useEnumLabel } from "../../../i18n/helpers";
import { EXPERIENCE_OPTIONS, SALARY_OPTIONS, TYPE_OPTIONS } from "./home-job-filtering";

const ActiveChip = ({ label, onRemove, removeLabel }) => (
  <span className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-tint-line bg-tint pl-3 pr-1 text-sm font-semibold text-primary-text">
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-surface"
    >
      <FaTimes className="text-xs" aria-hidden="true" />
    </button>
  </span>
);

/** Filters (type / experience / salary), sort order and the removable chips of active filters. */
const HomeFilterBar = ({ filters, hasActiveFilters, sortBy, onSortChange, onUpdate, onClearAll }) => {
  const { t } = useTranslation("public");
  const enumLabel = useEnumLabel();

  const chips = [
    filters.search && { key: "search", label: t("home.filters.chipKeyword", { value: filters.search }) },
    filters.location && { key: "location", label: t("home.filters.chipLocation", { value: filters.location }) },
    filters.category && { key: "category", label: t("home.filters.chipCategory", { value: categoryName(t, filters.category) }) },
    filters.type && { key: "type", label: t("home.filters.chipType", { value: enumLabel("jobType", filters.type) }) },
    filters.experience && { key: "experience", label: t("home.filters.chipExperience", { value: enumLabel("experienceLevel", filters.experience) }) },
    filters.salary && { key: "salary", label: t("home.filters.chipSalary", { value: t(`home.filters.salary.${filters.salary}`, { defaultValue: filters.salary }) }) },
  ].filter(Boolean);

  return (
    <div className="mb-6 rounded-card border border-tint-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex-1">
          <Select label={t("home.filters.type")} value={filters.type} onChange={(e) => onUpdate({ type: e.target.value })}>
            <option value="">{t("home.filters.all")}</option>
            {TYPE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {enumLabel("jobType", value)}
              </option>
            ))}
          </Select>
          <Select label={t("home.filters.experience")} value={filters.experience} onChange={(e) => onUpdate({ experience: e.target.value })}>
            <option value="">{t("home.filters.all")}</option>
            {EXPERIENCE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {enumLabel("experienceLevel", value)}
              </option>
            ))}
          </Select>
          <Select label={t("home.filters.salaryLabel")} value={filters.salary} onChange={(e) => onUpdate({ salary: e.target.value })}>
            <option value="">{t("home.filters.all")}</option>
            {SALARY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`home.filters.salary.${value}`)}
              </option>
            ))}
          </Select>
        </div>
        <Select
          className="lg:w-60"
          label={t("home.sort.label")}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          data-testid="home-sort"
        >
          <option value="newest">{t("home.sort.newest")}</option>
          <option value="salary-desc">{t("home.sort.salary")}</option>
          <option value="title-asc">{t("home.sort.title")}</option>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
            <FaFilter className="text-xs" aria-hidden="true" />
            {t("home.filters.active")}
          </span>
          {chips.map((chip) => (
            <ActiveChip
              key={chip.key}
              label={chip.label}
              removeLabel={t("home.filters.remove", { label: chip.label })}
              onRemove={() => onUpdate({ [chip.key]: "" })}
            />
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-10 cursor-pointer px-2 text-sm font-semibold text-danger underline-offset-4 hover:underline"
          >
            {t("home.filters.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
};

/** Category slug (URL value) -> translated name, falling back to the slug. */
const categoryName = (t, slug) => {
  const id = slug.toLowerCase();
  return t(`home.categories.${id}`, { defaultValue: slug });
};

export default HomeFilterBar;
