import React from "react";
import { FiBriefcase, FiDownload, FiEdit3, FiFileText, FiXCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, StatusBadge } from "../../ui";
import { useLocale } from "../../../i18n/helpers";
import { getInitials, toSkillList } from "./applicant-tracker-helpers";

const SectionTitle = ({ icon: Icon, tone = "text-primary-text", children }) => (
  <h4 className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-muted">
    {Icon && <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden="true" />}
    <span>{children}</span>
  </h4>
);

const Field = ({ label, children }) => (
  <div>
    <span className="block font-medium text-muted">{label}</span>
    <span className="font-semibold text-ink">{children}</span>
  </div>
);

/** Full candidate profile dialog with resume download and a shortcut to the status dialog. */
const ApplicantDetailModal = ({ applicant, downloading, onClose, onDownloadResume, onChangeStatus }) => {
  const { t } = useTranslation("employer");
  const locale = useLocale();
  const skills = applicant.skills ? toSkillList(applicant.skills) : [];

  return (
    <div
      className="!mt-0 fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("applicants.detail.ariaLabel")}
    >
      <Card className="max-h-[90vh] w-full max-w-3xl space-y-6 overflow-y-auto">
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
              {getInitials(applicant.applicantName)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink">{applicant.applicantName}</h2>
              <p className="text-sm text-muted">
                {t("applicants.detail.applyingFor")}{" "}
                <span className="font-semibold text-ink">
                  {applicant.job?.title || t("applicants.roleFallback", { id: applicant.jobId })}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1.5 text-muted transition-colors hover:bg-tint hover:text-ink"
            aria-label={t("applicants.detail.close")}
          >
            <FiXCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-card border border-line bg-tint p-4 text-xs sm:grid-cols-2 md:grid-cols-3">
          <Field label={t("applicants.detail.email")}>
            <span className="break-all">{applicant.applicantEmail}</span>
          </Field>
          <Field label={t("applicants.detail.phone")}>
            {applicant.applicantPhone || t("applicants.detail.notProvided")}
          </Field>
          <Field label={t("applicants.detail.appliedOn")}>
            {new Date(applicant.applicationDate || applicant.createdAt).toLocaleDateString(locale, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Field>
          <Field label={t("applicants.detail.availability")}>
            {applicant.availability || t("applicants.detail.immediate")}
          </Field>
          <Field label={t("applicants.detail.expectedSalary")}>
            {applicant.expectedSalary || t("applicants.detail.notSpecified")}
          </Field>
          <div>
            <span className="block font-medium text-muted">{t("applicants.detail.currentStatus")}</span>
            <StatusBadge group="applicationStatus" value={applicant.status} className="mt-0.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {applicant.experience && (
            <div className="space-y-1.5">
              <SectionTitle icon={FiBriefcase}>{t("applicants.detail.experience")}</SectionTitle>
              <p className="whitespace-pre-line rounded-card border border-line bg-surface p-3.5 text-sm leading-relaxed text-ink">
                {applicant.experience}
              </p>
            </div>
          )}
          {applicant.education && (
            <div className="space-y-1.5">
              <SectionTitle icon={FiFileText}>{t("applicants.detail.education")}</SectionTitle>
              <p className="whitespace-pre-line rounded-card border border-line bg-surface p-3.5 text-sm leading-relaxed text-ink">
                {applicant.education}
              </p>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className="space-y-1.5">
            <SectionTitle>{t("applicants.detail.skills")}</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-pill border border-tint-line bg-tint px-2.5 py-1 text-xs font-semibold text-primary-text"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {applicant.coverLetter && (
          <div className="space-y-1.5">
            <SectionTitle>{t("applicants.detail.coverLetter")}</SectionTitle>
            <div className="whitespace-pre-line rounded-card border border-line bg-tint p-4 text-sm leading-relaxed text-ink">
              {applicant.coverLetter}
            </div>
          </div>
        )}

        {applicant.notes && (
          <div className="space-y-1.5">
            <SectionTitle icon={FiEdit3} tone="text-warning">
              {t("applicants.detail.notes")}
            </SectionTitle>
            <div className="rounded-card border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning">
              {applicant.notes}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line pt-4 sm:flex-row">
          {applicant.resumePath ? (
            <Button
              variant="outline"
              onClick={() => onDownloadResume(applicant)}
              disabled={downloading}
              leftIcon={<FiDownload />}
              className="w-full sm:w-auto"
            >
              {downloading ? t("applicants.detail.downloadingResume") : t("applicants.detail.downloadResume")}
            </Button>
          ) : (
            <span className="text-xs italic text-muted">{t("applicants.detail.noResume")}</span>
          )}
          <Button onClick={() => onChangeStatus(applicant)} leftIcon={<FiEdit3 />} className="w-full sm:w-auto">
            {t("applicants.detail.updateStatus")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ApplicantDetailModal;
