import React from "react";
import { FiEye, FiDownload, FiMail, FiPhone, FiCalendar, FiEdit3 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, StatusBadge } from "../../ui";
import { useLocale } from "../../../i18n/helpers";
import { getInitials } from "./applicant-tracker-helpers";

/** Applicants table: candidate, position, status, submitted date, resume and row actions. */
const ApplicantTable = ({ applicants, downloadingResumeId, onReview, onChangeStatus, onDownloadResume }) => {
  const { t } = useTranslation("employer");
  const locale = useLocale();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line-strong text-[11px] font-bold uppercase tracking-wider text-muted">
            <th className="px-6 py-3.5">{t("applicants.table.candidate")}</th>
            <th className="px-6 py-3.5">{t("applicants.table.position")}</th>
            <th className="px-6 py-3.5">{t("applicants.table.status")}</th>
            <th className="px-6 py-3.5">{t("applicants.table.submitted")}</th>
            <th className="px-6 py-3.5">{t("applicants.table.resume")}</th>
            <th className="px-6 py-3.5 text-right">{t("applicants.table.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-sm">
          {applicants.map((applicant) => {
            const isDownloading = downloadingResumeId === applicant.id;
            return (
              <tr key={applicant.id} data-testid="applicant-row" className="transition-colors hover:bg-tint">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                      {getInitials(applicant.applicantName)}
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onReview(applicant)}
                        className="block truncate text-left font-bold text-ink transition-colors hover:text-primary-text"
                      >
                        {applicant.applicantName}
                      </button>
                      <div className="mt-0.5 flex items-center space-x-3 text-xs text-muted">
                        <span className="flex items-center space-x-1">
                          <FiMail className="h-3 w-3" aria-hidden="true" />
                          <span>{applicant.applicantEmail}</span>
                        </span>
                        {applicant.applicantPhone && (
                          <span className="hidden items-center space-x-1 md:flex">
                            <FiPhone className="h-3 w-3" aria-hidden="true" />
                            <span>{applicant.applicantPhone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="font-semibold text-ink">
                    {applicant.job?.title || t("applicants.roleFallback", { id: applicant.jobId })}
                  </p>
                  <p className="text-xs text-muted">{applicant.job?.company || t("applicants.yourCompany")}</p>
                </td>

                <td className="px-6 py-4">
                  <StatusBadge group="applicationStatus" value={applicant.status} />
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1 text-xs text-muted">
                    <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {new Date(applicant.applicationDate || applicant.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {applicant.resumePath ? (
                    <button
                      type="button"
                      onClick={() => onDownloadResume(applicant)}
                      disabled={isDownloading}
                      className="inline-flex items-center space-x-1 rounded-pill border border-tint-line px-3 py-1 text-xs font-medium text-primary-text transition-colors hover:bg-tint disabled:opacity-50"
                    >
                      <FiDownload className={`h-3 w-3 ${isDownloading ? "animate-bounce" : ""}`} aria-hidden="true" />
                      <span>{isDownloading ? t("applicants.downloading") : t("applicants.resume")}</span>
                    </button>
                  ) : (
                    <span className="text-xs italic text-muted">{t("applicants.noResumeShort")}</span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => onReview(applicant)} leftIcon={<FiEye />}>
                      {t("applicants.review")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onChangeStatus(applicant)} leftIcon={<FiEdit3 />}>
                      {t("applicants.statusButton")}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicantTable;
