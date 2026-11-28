import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowRight, FiBriefcase, FiCalendar, FiCheckCircle, FiDownload, FiMapPin, FiXCircle } from "react-icons/fi";
import { Button, Card, StatusBadge, cx } from "../ui";
import { useLocale } from "../../i18n/helpers";
import { applicationService } from "../../services/applicationService";

/** Position of each status on the 5-step pipeline (0 = left the pipeline). */
const STEP_BY_STATUS = {
  pending: 1,
  under_review: 2,
  shortlisted: 3,
  interview_scheduled: 4,
  interviewed: 4,
  offered: 5,
  accepted: 5,
  rejected: 0,
  withdrawn: 0,
};
const PIPELINE_STEPS = [1, 2, 3, 4, 5];
const WITHDRAWABLE = ["pending", "under_review", "shortlisted", "interview_scheduled"];

const PipelineTrack = ({ step }) => {
  const { t } = useTranslation("candidate");
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label={t("applications.progress")}>
      {PIPELINE_STEPS.map((id) => {
        const reached = step >= id;
        return (
          <li key={id} className="min-w-0">
            <span className={cx("block h-1.5 rounded-full", reached ? "bg-primary-500" : "bg-line")} />
            <span className={cx("mt-2 block truncate text-xs", step === id ? "font-bold text-primary-text" : "text-muted")} title={t(`pipeline.${id}`)}>
              {t(`pipeline.${id}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

/** One submitted application: where it stands, key dates and the actions still available. */
const ApplicationCard = ({ application, onWithdraw, onFeedback, actionLoadingId = null }) => {
  const { t } = useTranslation("candidate");
  const locale = useLocale();
  if (!application) return null;

  const status = application.status || "pending";
  const step = STEP_BY_STATUS[status] ?? 1;
  const jobId = application.jobId || application.job?.id;
  const canWithdraw = WITHDRAWABLE.includes(status);
  const appliedOn = new Date(application.applicationDate || application.createdAt);

  const handleDownload = async () => {
    try {
      await applicationService.downloadResume(application.id, application.applicantName || "Application");
      onFeedback?.("success", t("applications.feedback.downloaded"));
    } catch {
      onFeedback?.("error", t("applications.feedback.downloadFailed"));
    }
  };

  return (
    <Card as="article" padding="md" data-testid="application-card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="break-words text-xl font-bold leading-snug text-ink">
            {application.job?.title || application.jobTitle || t("applications.fallbackTitle")}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <FiBriefcase aria-hidden="true" />
              {application.job?.company || application.company || t("applications.fallbackCompany")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiMapPin aria-hidden="true" />
              {application.job?.location || t("applications.noLocation")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiCalendar aria-hidden="true" />
              {Number.isNaN(appliedOn.getTime())
                ? t("applications.appliedRecently")
                : t("applications.appliedOn", { date: appliedOn.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }) })}
            </span>
          </p>
        </div>
        <StatusBadge group="applicationStatus" value={status} size="md" className="self-start" />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {step === 0 ? (
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <FiXCircle className={status === "rejected" ? "text-danger" : "text-muted"} aria-hidden="true" />
            {status === "rejected" ? t("applications.rejectedNote") : t("applications.withdrawnNote")}
          </p>
        ) : (
          <PipelineTrack step={step} />
        )}
      </div>

      {(application.interviewDate || application.offerDeadline) && (
        <div className="mt-4 space-y-1 rounded-control bg-tint p-3 text-sm font-medium text-ink">
          {application.interviewDate && (
            <p className="flex items-center gap-2">
              <FiCalendar className="text-primary-text" aria-hidden="true" />
              {t("applications.interviewAt", { date: new Date(application.interviewDate).toLocaleString(locale) })}
            </p>
          )}
          {application.offerDeadline && (
            <p className="flex items-center gap-2 text-success">
              <FiCheckCircle aria-hidden="true" />
              {t("applications.offerDeadline", { date: new Date(application.offerDeadline).toLocaleDateString(locale) })}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {application.resumePath && (
          <Button variant="ghost" size="sm" leftIcon={<FiDownload />} onClick={handleDownload}>
            {t("applications.downloadResume")}
          </Button>
        )}
        {canWithdraw && onWithdraw && (
          <Button variant="ghost" size="sm" leftIcon={<FiXCircle />} disabled={actionLoadingId === application.id} onClick={() => onWithdraw(application)} className="text-danger">
            {t("applications.withdraw")}
          </Button>
        )}
        {jobId && (
          <Button as={Link} to={`/jobs/${jobId}`} variant="outline" size="sm" rightIcon={<FiArrowRight />} className="sm:ml-auto">
            {t("applications.viewJob")}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ApplicationCard;
