import React from "react";
import { FiBriefcase, FiMail, FiCalendar, FiDownload, FiEdit2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, StatusBadge } from "../../../components/ui";
import { useLocale } from "../../../i18n/helpers";
import { candidateNameOf } from "./interview-helpers";

/** One candidate in the interview stage: identity, job, notes, resume download and status update. */
const InterviewCandidateCard = ({ app, downloading, onDownloadResume, onUpdateStatus }) => {
  const { t } = useTranslation("employer");
  const locale = useLocale();
  const candidateName = candidateNameOf(app) || t("interviews.candidate");
  const candidateEmail = app.user?.email || app.applicantEmail || app.email || t("interviews.noEmail");
  const appliedDate = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString(locale)
    : t("interviews.recently");

  return (
    <Card
      data-testid="interview-candidate-card"
      className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
      <div className="flex items-start space-x-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary-600 text-base font-bold text-white">
          {candidateName.slice(0, 2).toUpperCase()}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-ink">{candidateName}</h3>
            <StatusBadge group="applicationStatus" value={app.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center space-x-1 font-medium text-ink">
              <FiBriefcase className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{app.job?.title || t("interviews.jobPosting")}</span>
            </span>
            <span className="flex items-center space-x-1">
              <FiMail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{candidateEmail}</span>
            </span>
            <span className="flex items-center space-x-1">
              <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t("interviews.applied", { date: appliedDate })}</span>
            </span>
          </div>
          {app.notes && (
            <div className="mt-2 rounded-card border border-line bg-tint p-2.5 text-xs text-muted">
              <span className="font-semibold text-ink">{t("interviews.notesLabel")} </span>
              {app.notes}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end md:self-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownloadResume(app)}
          disabled={downloading}
          leftIcon={<FiDownload className={downloading ? "animate-bounce" : ""} />}
        >
          {downloading ? t("interviews.downloading") : t("interviews.resume")}
        </Button>
        <Button size="sm" onClick={() => onUpdateStatus(app)} leftIcon={<FiEdit2 />}>
          {t("interviews.updateStatus")}
        </Button>
      </div>
    </Card>
  );
};

export default InterviewCandidateCard;
