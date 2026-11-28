import React from "react";
import { FiXCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, Select, Textarea } from "../../../components/ui";
import { candidateNameOf } from "./interview-helpers";

// Values sent to the API; labels are employer:interviews.modal.options.<value>
const NEXT_STATUS_OPTIONS = ["interview_scheduled", "interviewed", "offered", "accepted", "rejected"];

/** Dialog to move a candidate to the next pipeline stage with interviewer notes. */
const InterviewStatusModal = ({
  target,
  newStatus,
  notes,
  submitting,
  onStatusChange,
  onNotesChange,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation(["employer", "common"]);
  return (
    <div
      className="!mt-0 fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("employer:interviews.modal.title")}
    >
      <Card className="w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink">{t("employer:interviews.modal.title")}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {candidateNameOf(target) || t("employer:interviews.candidate")} — {target.job?.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1 text-muted transition-colors hover:bg-tint hover:text-ink"
            aria-label={t("employer:interviews.modal.close")}
          >
            <FiXCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            label={t("employer:interviews.modal.nextStatus")}
            value={newStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {NEXT_STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`employer:interviews.modal.options.${value}`)}
              </option>
            ))}
          </Select>
          <Textarea
            label={t("employer:interviews.modal.notes")}
            rows={4}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={t("employer:interviews.modal.notesPlaceholder")}
          />
          <div className="flex items-center justify-end space-x-3 border-t border-line pt-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {submitting ? t("employer:interviews.modal.updating") : t("employer:interviews.modal.save")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default InterviewStatusModal;
