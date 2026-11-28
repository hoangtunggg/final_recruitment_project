import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiBriefcase, FiRefreshCw, FiSearch } from "react-icons/fi";
import { Button, Card, EmptyState, Input, Select } from "../ui";
import ApplicationCard from "./ApplicationCard";

const STATUS_FILTERS = ["all", "pending", "under_review", "shortlisted", "interview", "offered", "rejected", "withdrawn"];

const ApplicationSkeleton = () => (
  <div aria-hidden="true" className="animate-pulse rounded-card border border-tint-line bg-surface p-6 shadow-card">
    <div className="flex items-start justify-between gap-4">
      <div className="w-1/2 space-y-2">
        <div className="h-5 w-3/4 rounded bg-tint" />
        <div className="h-4 w-1/2 rounded bg-tint" />
      </div>
      <div className="h-6 w-24 rounded-pill bg-tint" />
    </div>
    <div className="mt-6 h-2 rounded bg-tint" />
  </div>
);

/** Does an application with `status` belong to the selected filter? ("interview" and "offered" group two statuses.) */
const matchesStatusFilter = (status, filter) => {
  if (filter === "all") return true;
  if (filter === "interview") return status === "interview_scheduled" || status === "interviewed";
  if (filter === "offered") return status === "offered" || status === "accepted";
  return status === filter;
};

/** Searchable, filterable list of the candidate's applications with loading / error / empty states. */
const ApplicationList = ({ applications = [], loading = false, error = null, initialStatus = "all", onRetry, onExplore, onWithdraw, onFeedback, actionLoadingId = null }) => {
  const { t } = useTranslation("candidate");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");
  const [prevInitialStatus, setPrevInitialStatus] = useState(initialStatus);

  // A KPI card on the overview can preselect a status; adopt it when it changes.
  if (initialStatus !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus);
    setStatusFilter(initialStatus || "all");
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return applications.filter((app) => {
      const title = app.job?.title || app.jobTitle || "";
      const company = app.job?.company || app.company || "";
      const location = app.job?.location || "";
      const matchesSearch = !query || [title, company, location].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && matchesStatusFilter(app.status || "pending", statusFilter);
    });
  }, [applications, search, statusFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-5">
      <Card padding="md">
        <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
          <Input
            label={t("applications.search")}
            type="search"
            leftIcon={<FiSearch />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("applications.searchPlaceholder")}
          />
          <Select label={t("applications.statusFilter")} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_FILTERS.map((id) => (
              <option key={id} value={id}>
                {t(`applications.filters.${id}`)}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            <span className="text-muted">{t("applications.showing", { shown: filtered.length, total: applications.length })}</span>
            <button type="button" onClick={clearFilters} className="min-h-10 cursor-pointer font-semibold text-danger hover:underline">
              {t("applications.clearFilters")}
            </button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <ApplicationSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<FiAlertCircle />}
          title={t("applications.errorTitle")}
          description={t("applications.errorDescription")}
          action={
            onRetry && (
              <Button variant="outline" leftIcon={<FiRefreshCw />} onClick={onRetry}>
                {t("common.retry")}
              </Button>
            )
          }
        />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((application) => (
            <ApplicationCard
              key={application.id || application._id}
              application={application}
              onWithdraw={onWithdraw}
              onFeedback={onFeedback}
              actionLoadingId={actionLoadingId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FiBriefcase />}
          title={hasFilters ? t("applications.noMatchTitle") : t("applications.emptyTitle")}
          description={hasFilters ? t("applications.noMatchDescription") : t("applications.emptyDescription")}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                {t("applications.clearFilters")}
              </Button>
            ) : (
              onExplore && <Button onClick={onExplore}>{t("common.exploreRecommended")}</Button>
            )
          }
        />
      )}
    </div>
  );
};

export default ApplicationList;
