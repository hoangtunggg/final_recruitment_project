import React from "react";
import { FiXCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, Textarea } from "../../ui";
import { useEnumLabel } from "../../../i18n/helpers";
import { APPLICATION_STATUSES } from "./applicant-tracker-helpers";

/** Pick a pipeline stage (applies immediately with the notes) or save the notes without changing the stage. */
const ApplicantStatusModal = ({ target, notes, updating, onNotesChange, onSelectStatus, onSaveNotes, onClose }) => {
  const { t } = useTranslation(["employer", "common"]);
  const label = useEnumLabel();

  return (
    <div
      className="!mt-0 fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("employer:applicants.statusModal.title")}
    >
      <Card className="w-full max-w-lg space-y-5">
        <div className="flex items-start justify-between border-b border-line pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-ink">{t("employer:applicants.statusModal.title")}</h3>
            <p className="mt-0.5 text-xs text-muted">
              {target.applicantName} •{" "}
              {target.job?.title || t("employer:applicants.roleFallback", { id: target.jobId })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1 text-muted transition-colors hover:bg-tint hover:text-ink"
            aria-label={t("employer:applicants.statusModal.close")}
          >
            <FiXCircle className="h-5 w-5" />
          </button>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            {t("employer:applicants.statusModal.selectStage")}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {APPLICATION_STATUSES.map((value) => {
              const isCurrent = target.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isCurrent}
                  data-testid={`status-option-${value}`}
                  onClick={() => onSelectStatus(target, value, notes)}
                  disabled={updating}
                  className={`rounded-card border p-2.5 text-left text-xs font-semibold transition-colors disabled:opacity-50 ${
                    isCurrent
                      ? "border-primary-500 bg-tint text-primary-text ring-2 ring-primary-500/20"
                      : "border-line bg-surface text-ink hover:bg-tint"
                  }`}
                >
                  <span className="block truncate">{label("applicationStatus", value)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Textarea
          label={t("employer:applicants.statusModal.notes")}
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t("employer:applicants.statusModal.notesPlaceholder")}
        />

        <div className="flex items-center justify-end space-x-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button size="sm" loading={updating} onClick={() => onSaveNotes(target, target.status, notes)}>
            {updating ? t("employer:applicants.statusModal.savingNotes") : t("employer:applicants.statusModal.saveNotes")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ApplicantStatusModal;
