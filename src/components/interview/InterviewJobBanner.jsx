import { FiBriefcase } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Badge, Spinner } from "../ui";

/**
 * Shown when the page is opened as /interview?jobId=<uuid>: which job the JD box was prefilled from.
 * job = fetched job, state = "loading" | "ready" | "failed" (a failed load just means the user pastes a JD).
 */
const InterviewJobBanner = ({ job, state }) => {
  const { t } = useTranslation("interview");
  if (state === "loading") {
    return (
      <div className="mb-6 flex items-center gap-2 text-sm text-muted" role="status">
        <Spinner size="sm" />
        {t("setup.jobLoading")}
      </div>
    );
  }
  if (state === "failed") {
    return (
      <p className="mb-6 rounded-control border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning" role="status">
        {t("setup.jobFailed")}
      </p>
    );
  }
  if (state !== "ready" || !job) return null;
  return (
    <div
      data-testid="interview-job-banner"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-control border border-tint-line bg-surface px-4 py-3"
    >
      <Badge tone="primary" size="sm" icon={<FiBriefcase />}>
        {t("setup.jobBadge")}
      </Badge>
      <span className="font-semibold" data-testid="interview-job-title">
        {job.title}
      </span>
      {job.company && <span className="text-sm text-muted">{job.company}</span>}
    </div>
  );
};

export default InterviewJobBanner;
