import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiCheck, FiClock, FiDownload, FiFileText, FiInfo, FiTrash2, FiUpload } from "react-icons/fi";
import { Badge, Button, Card, EmptyState, Spinner, cx } from "../ui";
import { useLocale } from "../../i18n/helpers";

const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Upload button: a real <label> for the hidden file input, so it is keyboard and screen-reader friendly. */
const UploadButton = ({ inputId, uploading, label, busyLabel }) => (
  <label
    htmlFor={inputId}
    className={cx(
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-primary-600 bg-primary-600 px-8 py-2 font-semibold text-white transition-colors focus-within:shadow-focus",
      uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-primary-700"
    )}
  >
    {uploading ? <Spinner size="sm" /> : <FiUpload aria-hidden="true" />}
    {uploading ? busyLabel : label}
  </label>
);

const ResumeRow = ({ resume, locale, busy, uploading, onSetDefault, onDownload, onDelete }) => {
  const { t } = useTranslation("candidate");
  const isDefault = Boolean(resume.isDefault);
  const uploaded = resume.uploadedDate
    ? new Date(resume.uploadedDate).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
    : t("resumes.recently");
  const iconButton = "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <li
      data-testid="resume-row"
      className={cx(
        "flex flex-col gap-4 rounded-card border p-4 sm:flex-row sm:items-center sm:justify-between",
        isDefault ? "border-primary-500 bg-tint" : "border-line bg-surface"
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span
          aria-hidden="true"
          className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl", isDefault ? "bg-primary-600 text-white" : "bg-tint text-primary-text")}
        >
          <FiFileText />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-ink">{resume.name}</h3>
            {isDefault && (
              <Badge tone="primary" size="sm" icon={<FiCheck />}>
                {t("resumes.default")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <FiClock aria-hidden="true" />
            {t("resumes.uploadedOn", { date: uploaded })}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!isDefault && (
          <Button variant="outline" size="sm" disabled={busy || uploading} onClick={() => onSetDefault(resume.id)}>
            {busy ? t("resumes.updating") : t("resumes.setDefault")}
          </Button>
        )}
        <button type="button" disabled={busy} title={t("resumes.download")} aria-label={t("resumes.downloadAria", { name: resume.name })} onClick={() => onDownload(resume.id, resume.name)} className={cx(iconButton, "hover:border-primary-500 hover:text-primary-text")}>
          <FiDownload aria-hidden="true" />
        </button>
        <button type="button" disabled={busy} title={t("resumes.delete")} aria-label={t("resumes.deleteAria", { name: resume.name })} onClick={() => onDelete(resume.id, resume.name)} className={cx(iconButton, "hover:border-danger hover:text-danger")}>
          <FiTrash2 aria-hidden="true" />
        </button>
      </div>
    </li>
  );
};

/** The candidate's CV library: upload, set default, download and delete (with loading / error / empty states). */
const ResumeManager = ({ resumes = [], loading = false, error = null, uploading = false, actionLoadingId = null, onUpload, onSetDefault, onDownload, onDelete, onRetry }) => {
  const { t } = useTranslation("candidate");
  const locale = useLocale();
  const fileInputRef = useRef(null);
  const inputId = "resume-upload-input";

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    // Reset so selecting the same file again still triggers onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const upload = <UploadButton inputId={inputId} uploading={uploading} label={t("resumes.upload")} busyLabel={t("resumes.uploading")} />;

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} id={inputId} type="file" accept={ACCEPT} onChange={handleFileChange} disabled={uploading} className="sr-only" data-testid="resume-file-input" />

      <Card padding="md">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-ink">{t("resumes.title", { n: resumes.length })}</h2>
            <p className="mt-1 text-muted">{t("resumes.subtitle")}</p>
          </div>
          {upload}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-control bg-tint p-3 text-sm text-muted">
          <FiInfo className="mt-0.5 shrink-0 text-primary-text" aria-hidden="true" />
          {t("resumes.guideline")}
        </p>
      </Card>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-tint" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<FiAlertCircle />}
          title={t("resumes.errorTitle")}
          description={t("resumes.errorDescription")}
          action={onRetry && <Button variant="outline" onClick={onRetry}>{t("common.retry")}</Button>}
        />
      ) : resumes.length === 0 ? (
        <EmptyState icon={<FiFileText />} title={t("resumes.emptyTitle")} description={t("resumes.emptyDescription")} action={upload} />
      ) : (
        <ul className="space-y-3">
          {resumes.map((resume) => (
            <ResumeRow
              key={resume.id}
              resume={resume}
              locale={locale}
              busy={actionLoadingId === resume.id}
              uploading={uploading}
              onSetDefault={onSetDefault}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResumeManager;
