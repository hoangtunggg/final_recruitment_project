import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { Button } from "../../../components/ui";
import { useEnumLabel } from "../../../i18n/helpers";
import { QUICK_TAGS } from "./home-job-filtering";

const FieldShell = ({ icon, children, className = "" }) => (
  <div
    className={`flex min-h-12 flex-1 items-center gap-3 rounded-pill border border-transparent px-4 transition-colors focus-within:border-primary-500 focus-within:bg-surface focus-within:shadow-focus ${className}`}
  >
    <span aria-hidden="true" className="text-primary-text">
      {icon}
    </span>
    {children}
  </div>
);

const inputClass =
  "w-full min-w-0 border-none bg-transparent p-0 text-base text-ink placeholder:text-muted/75 focus:outline-none focus:ring-0";

/**
 * Search hero: headline, pill search bar (keyword + location) and popular quick filters.
 * `initialSearch` / `initialLocation` come from the URL; the component remounts (via `key`)
 * when the URL changes so the inputs never go stale.
 */
const HomeHero = ({ initialSearch, initialLocation, openJobs, loading, onSearch, onQuickTag }) => {
  const { t } = useTranslation("public");
  const enumLabel = useEnumLabel();
  const [keyword, setKeyword] = useState(initialSearch);
  const [place, setPlace] = useState(initialLocation);

  const submit = (event) => {
    event.preventDefault();
    onSearch({ search: keyword.trim(), location: place.trim() });
  };

  const status = loading
    ? t("home.hero.statusLoading")
    : openJobs > 0
    ? t("home.hero.statusOpen", { n: openJobs })
    : t("home.hero.statusIdle");

  return (
    <section data-testid="home-hero" className="relative overflow-hidden border-b border-tint-line bg-tint">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border-[40px] border-primary-500/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full border-[48px] border-brand-green/10" />

      <div className="relative mx-auto max-w-page px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="mx-auto inline-flex items-center gap-2 rounded-pill border border-tint-line bg-surface px-4 py-1.5 text-sm font-semibold text-primary-text">
          <span className="h-2 w-2 rounded-full bg-brand-green" aria-hidden="true" />
          {status}
        </p>

        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          {t("home.hero.titleStart")} <span className="text-primary-text">{t("home.hero.titleHighlight")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted sm:text-xl sm:leading-8">{t("home.hero.subtitle")}</p>

        <form
          onSubmit={submit}
          role="search"
          aria-label={t("home.hero.searchLabel")}
          className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-[2rem] border border-tint-line bg-surface p-2 shadow-card sm:flex-row sm:rounded-pill"
        >
          <FieldShell icon={<FaSearch />} className="flex-[1.4]">
            <input
              type="text"
              name="search"
              data-testid="home-search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t("home.hero.keywordPlaceholder")}
              aria-label={t("home.hero.keywordLabel")}
              className={inputClass}
            />
          </FieldShell>
          <FieldShell icon={<FaMapMarkerAlt />}>
            <input
              type="text"
              name="location"
              data-testid="home-location-input"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder={t("home.hero.locationPlaceholder")}
              aria-label={t("home.hero.locationLabel")}
              className={inputClass}
            />
          </FieldShell>
          <Button type="submit" size="lg" leftIcon={<FaSearch />} data-testid="home-search-submit" className="sm:shrink-0">
            {t("home.hero.searchButton")}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-semibold text-muted">{t("home.hero.popular")}</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onQuickTag(tag)}
              className="min-h-10 cursor-pointer rounded-pill border border-tint-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-primary-500 hover:text-primary-text"
            >
              {tag.enumGroup ? enumLabel(tag.enumGroup, tag.value) : t(`home.quickTags.${tag.id}`)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
