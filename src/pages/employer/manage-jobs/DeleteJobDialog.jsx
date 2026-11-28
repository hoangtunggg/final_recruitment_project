import React from "react";
import { FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card } from "../../../components/ui";

/** Accessible confirmation modal for permanently deleting a job posting. */
const DeleteJobDialog = ({ job, isDeleting, onCancel, onConfirm }) => {
  const { t } = useTranslation(["employer", "common"]);
  return (
    <div
      className="!mt-0 fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("employer:manageJobs.delete.ariaLabel")}
    >
      <Card className="w-full max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-danger/10 text-danger">
          <FiTrash2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1 text-center">
          <h3 className="text-lg font-extrabold text-ink">{t("employer:manageJobs.delete.title")}</h3>
          <p className="text-sm text-muted">
            {t("employer:manageJobs.delete.confirmPrefix")}{" "}
            <span className="font-semibold text-ink">"{job.title}"</span>
            {t("employer:manageJobs.delete.confirmSuffix")}
          </p>
        </div>
        <div className="flex items-center space-x-3 pt-2">
          <Button variant="outline" disabled={isDeleting} onClick={onCancel} className="flex-1">
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting}
            onClick={onConfirm}
            leftIcon={isDeleting ? undefined : <FiTrash2 />}
            className="flex-1"
          >
            {isDeleting ? t("employer:manageJobs.delete.deleting") : t("employer:manageJobs.delete.confirm")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeleteJobDialog;
