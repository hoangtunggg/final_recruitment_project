import { useTranslation } from "react-i18next";
import { FiCheck, FiDollarSign, FiMapPin, FiUser, FiX } from "react-icons/fi";
import { Button, StatusBadge } from "../../ui";
import { useEnumLabel, useLocale } from "../../../i18n/helpers";
import AdminModal, { AdminModalActions, AdminModalHeader } from "../shared/AdminModal";
import { AdminInfoItem, AdminSectionTitle, AdminTextBlock } from "../shared/AdminDetailParts";

// Listing statuses after which an approval does not republish the job.
const NOT_PUBLISHABLE = ["Closed", "inactive", "filled"];

/** Read-only job dialog with the approve / reject moderation actions. */
const JobDetailsModal = ({ job, loading, onApprove, onReject, onClose }) => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  const locale = useLocale();
  const notSpecified = t("shared.notSpecified");

  return (
    <AdminModal label={t("jobs.details.aria")} size="lg">
      <AdminModalHeader
        title={job.title}
        subtitle={t("jobs.details.subtitle", { company: job.company, id: job.id })}
        onClose={onClose}
      />

      <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-tint p-3.5 rounded-card border border-line">
          <AdminInfoItem label={t("jobs.details.location")} icon={<FiMapPin className="w-3.5 h-3.5" />}>
            {job.location}
          </AdminInfoItem>
          <AdminInfoItem label={t("jobs.details.jobType")}>{label("jobType", job.type)}</AdminInfoItem>
          <AdminInfoItem label={t("jobs.details.experience")}>
            {label("experienceLevel", job.experience) || notSpecified}
          </AdminInfoItem>
          <AdminInfoItem label={t("jobs.details.salary")} icon={<FiDollarSign className="w-3.5 h-3.5" />}>
            {job.salary || notSpecified}
          </AdminInfoItem>
          <AdminInfoItem label={t("jobs.details.listingStatus")}>
            <StatusBadge group="jobStatus" value={job.status} />
          </AdminInfoItem>
          <AdminInfoItem label={t("jobs.details.moderationStatus")}>
            <StatusBadge group="approvalStatus" value={job.approvalStatus} />
          </AdminInfoItem>
        </div>

        {job.employer && (
          <div className="p-3 bg-tint rounded-card border border-tint-line">
            <AdminSectionTitle icon={<FiUser className="w-3.5 h-3.5" />}>
              {t("jobs.details.postingEmployer")}
            </AdminSectionTitle>
            <p className="text-sm font-medium text-ink">
              {job.employer.name} ({job.employer.email})
            </p>
          </div>
        )}

        <div>
          <AdminSectionTitle>{t("jobs.details.description")}</AdminSectionTitle>
          <AdminTextBlock>{job.description}</AdminTextBlock>
        </div>
        <div>
          <AdminSectionTitle>{t("jobs.details.requirements")}</AdminSectionTitle>
          <AdminTextBlock>{job.requirements}</AdminTextBlock>
        </div>
        {job.responsibilities && (
          <div>
            <AdminSectionTitle>{t("jobs.details.responsibilities")}</AdminSectionTitle>
            <AdminTextBlock>{job.responsibilities}</AdminTextBlock>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AdminInfoItem label={t("jobs.details.deadline")}>
            {job.applicationDeadline
              ? new Date(job.applicationDeadline).toLocaleDateString(locale)
              : t("jobs.details.noDeadline")}
          </AdminInfoItem>
          <AdminInfoItem label={t("jobs.details.contact")}>
            {job.contactEmail || t("shared.none")} {job.contactPhone ? `• ${job.contactPhone}` : ""}
          </AdminInfoItem>
        </div>
      </div>

      <AdminModalActions justify="between">
        <div className="flex items-center gap-2">
          {job.approvalStatus !== "approved" && (
            <Button
              size="sm"
              onClick={() => onApprove(job)}
              disabled={loading}
              leftIcon={<FiCheck className="w-4 h-4" />}
            >
              {NOT_PUBLISHABLE.includes(job.status)
                ? t("jobs.actions.approve")
                : t("jobs.actions.approvePublish")}
            </Button>
          )}
          {job.approvalStatus !== "rejected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(job)}
              disabled={loading}
              leftIcon={<FiX className="w-4 h-4" />}
            >
              {t("jobs.actions.rejectClose")}
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t("common:actions.close")}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};

export default JobDetailsModal;
