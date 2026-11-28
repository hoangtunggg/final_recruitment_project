import { useTranslation } from "react-i18next";
import { FaArrowRight } from "react-icons/fa";
import { PageHeader, cx } from "../../../components/ui";
import { CATEGORIES } from "./home-job-filtering";

/** Category tiles with live counts. Clicking one toggles the ?category= filter and scrolls to the jobs. */
const HomeCategories = ({ counts, selected, onToggle }) => {
  const { t } = useTranslation("public");
  return (
    <section id="categories" className="scroll-mt-24 bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4">
        <PageHeader
          level={2}
          eyebrow={t("home.categoriesSection.eyebrow")}
          title={t("home.categoriesSection.title")}
          subtitle={t("home.categoriesSection.subtitle")}
          className="mb-8"
        />
        <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const count = counts[category.id] || 0;
            const isSelected = selected.toLowerCase() === category.slug.toLowerCase();
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onToggle(category.slug)}
                  aria-pressed={isSelected}
                  className={cx(
                    "group flex h-full min-h-40 w-full cursor-pointer flex-col justify-between rounded-card border p-5 text-left transition-shadow duration-200 hover:shadow-card-hover motion-reduce:transition-none",
                    isSelected ? "border-primary-500 bg-tint shadow-card-hover" : "border-tint-line bg-surface shadow-card"
                  )}
                >
                  <span className={cx("flex h-11 w-11 items-center justify-center rounded-full text-xl", category.tone)}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <span className="mt-4 block text-lg font-bold text-ink">{t(`home.categories.${category.id}`)}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {count > 0 ? t("home.categoriesSection.openRoles", { n: count }) : t("home.categoriesSection.explore")}
                    </span>
                  </span>
                  <span className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm font-semibold text-primary-text">
                    {isSelected ? t("home.categoriesSection.applied") : t("home.categoriesSection.view")}
                    <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default HomeCategories;
