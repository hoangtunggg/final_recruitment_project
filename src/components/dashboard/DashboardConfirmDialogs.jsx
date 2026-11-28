import React from "react";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "./ConfirmDialog";

/**
 * The two confirm dialogs of the candidate dashboard.
 * Props: resume = { toDelete, busy, onCancel, onConfirm } | null-ish (shown when toDelete is set),
 *        withdraw = { application, busy, onCancel, onConfirm } (shown when application is set).
 */
const DashboardConfirmDialogs = ({ resume, withdraw }) => {
  const { t } = useTranslation("candidate");
  return (
    <>
      {resume.toDelete && (
        <ConfirmDialog
          titleId="delete-resume-title"
          icon={<FiTrash2 />}
          title={t("resumes.deleteDialog.title")}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("resumes.deleteDialog.confirm")}
          busy={resume.busy}
          onCancel={resume.onCancel}
          onConfirm={resume.onConfirm}
        >
          <p>{t("resumes.deleteDialog.message", { name: resume.toDelete.name })}</p>
        </ConfirmDialog>
      )}

      {withdraw.application && (
        <ConfirmDialog
          titleId="withdraw-application-title"
          icon={<FiAlertCircle />}
          title={t("applications.withdrawDialog.title")}
          cancelLabel={t("applications.withdrawDialog.keep")}
          confirmLabel={t("applications.withdrawDialog.confirm")}
          busy={withdraw.busy}
          onCancel={withdraw.onCancel}
          onConfirm={withdraw.onConfirm}
        >
          <p>
            {t("applications.withdrawDialog.message", {
              title: withdraw.application.job?.title || t("applications.withdrawDialog.thisPosition"),
              company: withdraw.application.job?.company || t("applications.withdrawDialog.theCompany"),
            })}
          </p>
        </ConfirmDialog>
      )}
    </>
  );
};

export default DashboardConfirmDialogs;
