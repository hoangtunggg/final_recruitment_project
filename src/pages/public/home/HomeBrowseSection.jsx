import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBriefcase, FaMicrophoneAlt, FaRedo } from "react-icons/fa";
import JobCard from "../../../components/jobs/JobCard";
import JobSkeleton from "../../../components/jobs/JobSkeleton";
import { Button, Card, EmptyState, PageHeader } from "../../../components/ui";
import useAuth from "../../../hooks/useAuth";
import HomeFilterBar from "./HomeFilterBar";

const GRID = "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3";

/** Empty state shown when there is nothing to list (no jobs at all, or filters match nothing). */
const NoJobs = ({ hasActiveFilters, onClearAll }) => {
  const { t } = useTranslation("public");
  const { isAuthenticated, user } = useAuth();
  const isEmployer = isAuthenticated && user?.role === "employer";

  return (
    <EmptyState
      icon={<FaBriefcase />}
      title={hasActiveFilters ? t("home.browse.noMatchTitle") : t("home.browse.emptyTitle")}
      description={hasActiveFilters ? t("home.browse.noMatchDescription") : t("home.browse.emptyDescription")}
      action={
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {hasActiveFilters ? (
            <Button onClick={onClearAll}>{t("home.browse.resetFilters")}</Button>
          ) : (
            <>
              <Button as={Link} to="/interview" leftIcon={<FaMicrophoneAlt />}>
                {t("home.browse.tryInterview")}
              </Button>
              {!(isAuthenticated && !isEmployer) && (
                <Button as={Link} to={isEmployer ? "/employer/post-job" : "/register"} variant="outline">
                  {isEmployer ? t("home.browse.postJob") : t("home.browse.createAccount")}
                </Button>
              )}
            </>
          )}
        </div>
      }
    />
  );
};

/** "Browse open positions": count, filters and the job grid with loading / error / empty states. */
const HomeBrowseSection = ({ browser }) => {
  const { t } = useTranslation("public");
  const { loading, error, fetchJobs, filters, hasActiveFilters, sortBy, setSortBy, publishedJobs, sortedJobs, companyByName, updateParams, clearAllFilters } = browser;

  return (
    <section id="browse-jobs" data-testid="browse-jobs" className="scroll-mt-24 bg-canvas py-12 sm:py-16">
      <div id="featured-jobs" className="mx-auto max-w-page px-4">
        <PageHeader
          level={2}
          eyebrow={t("home.browse.eyebrow")}
          title={t("home.browse.title")}
          subtitle={t("home.browse.subtitle")}
          actions={
            <p className="text-sm font-semibold text-muted" aria-live="polite">
              {t("home.browse.showing", { shown: sortedJobs.length, total: publishedJobs.length })}
            </p>
          }
          className="mb-8"
        />

        <HomeFilterBar
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onUpdate={updateParams}
          onClearAll={clearAllFilters}
        />

        {loading ? (
          <div className={GRID}>
            {[...Array(6)].map((_, index) => (
              <JobSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <Card className="mx-auto max-w-lg text-center" role="alert">
            <p className="font-semibold text-danger">{t("home.browse.error")}</p>
            <Button variant="outline" size="sm" className="mt-4" leftIcon={<FaRedo />} onClick={fetchJobs}>
              {t("home.browse.retry")}
            </Button>
          </Card>
        ) : sortedJobs.length > 0 ? (
          <div className={GRID}>
            {sortedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={{ ...job, companyLogoUrl: companyByName.get(job.company?.toLowerCase())?.logoUrl }}
              />
            ))}
          </div>
        ) : (
          <NoJobs hasActiveFilters={hasActiveFilters} onClearAll={clearAllFilters} />
        )}
      </div>
    </section>
  );
};

export default HomeBrowseSection;
