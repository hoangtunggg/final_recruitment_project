import React from "react";
import { useTranslation } from "react-i18next";
import { FiBookmark, FiStar } from "react-icons/fi";
import { Button, Card, EmptyState } from "../ui";
import SavedJobCard from "./SavedJobCard";
import RecommendedJobCard from "./RecommendedJobCard";

const GRID = "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3";

/** Saved jobs tab: bookmarked listings (some may be closed) or an empty state. */
export const SavedJobsTab = ({ jobs, onRemove, onExplore }) => {
  const { t } = useTranslation("candidate");
  return (
    <div id="dashboard-panel-saved" role="tabpanel" aria-label={t("tabs.saved")} className="space-y-6">
      <Card padding="md">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink">{t("saved.title", { n: jobs.length })}</h2>
            <p className="mt-1 text-muted">{t("saved.subtitle")}</p>
          </div>
          {jobs.length > 0 && (
            <Button variant="outline" size="sm" onClick={onExplore}>
              {t("common.exploreRecommended")}
            </Button>
          )}
        </div>
      </Card>

      {jobs.length > 0 ? (
        <div className={GRID}>
          {jobs.map((job) => (
            <SavedJobCard key={job.id} job={job} onRemove={onRemove} isAvailable={job.isAvailable} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FiBookmark />}
          title={t("saved.emptyTitle")}
          description={t("saved.emptyDescription")}
          action={<Button onClick={onExplore}>{t("common.exploreRecommended")}</Button>}
        />
      )}
    </div>
  );
};

/** Recommended jobs tab: ranked by profile skills when the candidate has some. */
export const RecommendedJobsTab = ({ jobs, loading, candidateSkills, isJobSaved, onToggleSave }) => {
  const { t } = useTranslation("candidate");
  const skillPreview = candidateSkills.slice(0, 4).join(", ") + (candidateSkills.length > 4 ? "..." : "");

  return (
    <div id="dashboard-panel-recommended" role="tabpanel" aria-label={t("tabs.recommended")} className="space-y-6">
      <Card padding="md">
        <h2 className="text-xl font-bold text-ink">{t("recommended.title", { n: jobs.length })}</h2>
        <p className="mt-1 text-muted">
          {candidateSkills.length > 0 ? t("recommended.rankedBy", { skills: skillPreview }) : t("recommended.latest")}
        </p>
      </Card>

      {loading ? (
        <div className={GRID} aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-tint" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className={GRID}>
          {jobs.map((job) => (
            <RecommendedJobCard key={job.id} job={job} isSaved={isJobSaved(job.id)} onToggleSave={onToggleSave} matchedSkills={job.matchedSkills || []} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<FiStar />} title={t("recommended.emptyTitle")} description={t("recommended.emptyDescription")} />
      )}
    </div>
  );
};
