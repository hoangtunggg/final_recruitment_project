import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBriefcase, FiClock, FiDollarSign, FiExternalLink, FiMapPin } from "react-icons/fi";
import { Badge, Button, Card } from "../ui";
import { useEnumLabel } from "../../i18n/helpers";
import { jobTypeTone, useTimeAgo } from "../jobs/job-format-helpers";

/**
 * Shared card for the saved / recommended job lists.
 * Props: job, linkable (false = listing closed, no link), action (node, top-right icon button),
 *        closed (shows the "listing closed" badge), highlight (node between meta and footer),
 *        footerText (left footer text).
 * The title is a link and the action is a sibling button, so nothing interactive is nested.
 */
const JobSummaryCard = ({ job, linkable = true, action, closed = false, highlight, footerText }) => {
  const { t } = useTranslation("candidate");
  const enumLabel = useEnumLabel();
  const timeAgo = useTimeAgo();
  if (!job) return null;

  const title = job.title || t("jobCard.fallbackTitle");

  return (
    <Card as="article" padding="md" className="flex h-full flex-col justify-between" data-testid="job-summary-card">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {job.type && <Badge tone={jobTypeTone(job.type)} size="sm">{enumLabel("jobType", job.type)}</Badge>}
            {job.experience && <Badge tone="neutral" size="sm">{enumLabel("experienceLevel", job.experience)}</Badge>}
            {closed && <Badge tone="danger" size="sm">{t("jobCard.closed")}</Badge>}
          </div>
          {action}
        </div>

        <h3 className="mb-1 break-words text-xl font-bold leading-snug text-ink">
          {linkable ? (
            <Link to={`/jobs/${job.id}`} className="transition-colors hover:text-primary-text">
              {title}
            </Link>
          ) : (
            <span className="text-muted">{title}</span>
          )}
        </h3>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted">
          <FiBriefcase className="shrink-0" aria-hidden="true" />
          <span className="truncate">{job.company || t("jobCard.fallbackCompany")}</span>
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FiMapPin aria-hidden="true" />
            {job.location || t("jobCard.noLocation")}
          </span>
          {job.salary && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-success">
              <FiDollarSign aria-hidden="true" />
              {job.salary}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <FiClock aria-hidden="true" />
            {timeAgo(job.createdAt || job.posted)}
          </span>
        </div>
        {highlight}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-sm text-muted">{footerText}</span>
        {linkable ? (
          <Button as={Link} to={`/jobs/${job.id}`} variant="outline" size="sm" rightIcon={<FiExternalLink />}>
            {t("jobCard.view")}
          </Button>
        ) : (
          <span className="text-sm font-semibold text-muted">{t("jobCard.unavailable")}</span>
        )}
      </div>
    </Card>
  );
};

export default JobSummaryCard;
