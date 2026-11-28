import { useTranslation } from "react-i18next";
import { FaCheckCircle, FaFileUpload, FaTimes } from "react-icons/fa";
import { Button, Card, Input, Textarea } from "../../../components/ui";

/**
 * Application dialog. All state lives in useJobApplication; this component only renders it.
 * Props: job, user, app (the object returned by useJobApplication).
 */
const JobApplicationModal = ({ job, user, app }) => {
  const { t } = useTranslation("public");
  const { data, errors, submitting, success, handleChange, handleFile, submit, closeModal } = app;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        data-testid="apply-dialog"
        className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-card border border-tint-line bg-surface shadow-card sm:rounded-card"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 id="apply-title" className="text-xl font-bold text-ink">
              {t("apply.title")}
            </h2>
            <p className="truncate text-sm text-muted">
              {job.title} · {job.company}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            aria-label={t("apply.close")}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-tint hover:text-ink"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-5.5rem)] overflow-y-auto p-6">
          {success ? (
            <div className="py-10 text-center" role="status">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl text-success" aria-hidden="true">
                <FaCheckCircle />
              </span>
              <h3 className="text-xl font-bold text-ink">{t("apply.successTitle")}</h3>
              <p className="mx-auto mt-2 max-w-md text-muted">
                {t("apply.successBody", { title: job.title, company: job.company })}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              {errors.form && (
                <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger">
                  {errors.form}
                </p>
              )}

              <Card tone="tint" shadow={false} padding="sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">{t("apply.applicant")}</p>
                <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">{t("apply.name")}</dt>
                    <dd className="font-semibold text-ink">{user?.name || t("apply.nameFallback")}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Email</dt>
                    <dd className="break-all font-semibold text-ink">{user?.email}</dd>
                  </div>
                </dl>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t("apply.phone")} name="phone" type="tel" required autoComplete="tel" placeholder="0901 234 567" value={data.phone} onChange={handleChange} error={errors.phone} />
                <Input label={t("apply.education")} name="education" required value={data.education} onChange={handleChange} error={errors.education} placeholder={t("apply.educationPlaceholder")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t("apply.experience")} name="experience" required value={data.experience} onChange={handleChange} error={errors.experience} placeholder={t("apply.experiencePlaceholder")} />
                <Input label={t("apply.skills")} name="skills" required value={data.skills} onChange={handleChange} error={errors.skills} placeholder={t("apply.skillsPlaceholder")} />
              </div>
              <Textarea label={t("apply.coverLetter")} name="coverLetter" required rows={4} value={data.coverLetter} onChange={handleChange} error={errors.coverLetter} placeholder={t("apply.coverLetterPlaceholder")} />

              <div>
                <span className="mb-1 block text-sm font-medium text-ink">{t("apply.resume")}</span>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-tint-line bg-tint px-4 py-5 text-center transition-colors hover:border-primary-500 focus-within:border-primary-500">
                  <FaFileUpload className="text-2xl text-primary-text" aria-hidden="true" />
                  <span className="break-all text-sm font-semibold text-ink">
                    {data.resume ? data.resume.name : t("apply.resumeDrop")}
                  </span>
                  <span className="text-xs text-muted">{t("apply.resumeHint")}</span>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} className="sr-only" aria-label={t("apply.resume")} />
                </label>
                {errors.resume && <p role="alert" className="mt-1 text-sm font-medium text-danger">{errors.resume}</p>}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                  {t("apply.cancel")}
                </Button>
                <Button type="submit" loading={submitting}>
                  {submitting ? t("apply.submitting") : t("apply.submit")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal;
