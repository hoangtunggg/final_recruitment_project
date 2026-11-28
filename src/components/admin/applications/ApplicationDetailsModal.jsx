import { useTranslation } from "react-i18next";
import {
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { Badge, Button, StatusBadge } from "../../ui";
import { useLocale } from "../../../i18n/helpers";
import AdminModal, { AdminModalActions, AdminModalHeader } from "../shared/AdminModal";
import {
  AdminAvatar,
  AdminInfoItem,
  AdminSectionTitle,
  AdminTextBlock,
} from "../shared/AdminDetailParts";

// Skills arrive either as an array or as a comma-separated string.
const SkillBadges = ({ skills }) => {
  const { t } = useTranslation("admin");
  let list = [];
  if (Array.isArray(skills)) list = skills;
  else if (typeof skills === "string") list = skills.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) {
    return <span className="text-sm text-muted italic">{t("applications.details.noSkills")}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {list.map((skill, index) => (
        <Badge key={index} tone="primary" size="sm">
          {skill}
        </Badge>
      ))}
    </div>
  );
};

/**
 * Application details dialog. Props: application, downloadLoading (bool), onDownload(application),
 * onChangeStatus(application), onClose.
 */
const ApplicationDetailsModal = ({ application: app, downloadLoading, onDownload, onChangeStatus, onClose }) => {
  const { t } = useTranslation("admin");
  const locale = useLocale();
  const notProvided = t("shared.notProvided");
  const notSpecified = t("shared.notSpecified");
  const hasResume = Boolean(app.resumePath || app.resume);

  return (
    <AdminModal label={t("applications.details.aria")} size="lg">
      <AdminModalHeader
        leading={<AdminAvatar name={app.applicantName} fallback="A" />}
        title={app.applicantName}
        subtitle={t("applications.details.subtitle", {
          id: app.id,
          date: new Date(app.applicationDate).toLocaleDateString(locale),
        })}
        onClose={onClose}
      />

      <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-tint p-4 rounded-card space-y-2.5 border border-line">
            <AdminSectionTitle icon={<FiUser className="w-4 h-4 text-primary-text" />}>
              {t("applications.details.applicantInfo")}
            </AdminSectionTitle>
            <AdminInfoItem label={t("applications.details.fullName")}>{app.applicantName}</AdminInfoItem>
            <AdminInfoItem label={t("applications.details.email")} icon={<FiMail className="w-3.5 h-3.5" />}>
              {app.applicantEmail}
            </AdminInfoItem>
            <AdminInfoItem label={t("applications.details.phone")} icon={<FiPhone className="w-3.5 h-3.5" />}>
              {app.applicantPhone || notProvided}
            </AdminInfoItem>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <AdminInfoItem
                label={t("applications.details.expectedSalary")}
                icon={<FiDollarSign className="w-3 h-3" />}
              >
                {app.expectedSalary || notSpecified}
              </AdminInfoItem>
              <AdminInfoItem label={t("applications.details.availability")} icon={<FiClock className="w-3 h-3" />}>
                {app.availability || t("applications.details.immediate")}
              </AdminInfoItem>
            </div>
          </div>

          <div className="bg-tint p-4 rounded-card space-y-2.5 border border-line">
            <AdminSectionTitle icon={<FiBriefcase className="w-4 h-4 text-primary-text" />}>
              {t("applications.details.targetJob")}
            </AdminSectionTitle>
            <AdminInfoItem label={t("applications.details.jobTitle")}>
              {app.job?.title || t("applications.details.jobIdFallback", { id: app.jobId })}
            </AdminInfoItem>
            <AdminInfoItem label={t("applications.details.company")}>
              {app.job?.company || notSpecified}
            </AdminInfoItem>
            <AdminInfoItem label={t("applications.details.location")}>
              {app.job?.location || notSpecified}
            </AdminInfoItem>
            <AdminInfoItem label={t("applications.details.currentStatus")}>
              <StatusBadge group="applicationStatus" value={app.status} />
            </AdminInfoItem>
          </div>
        </div>

        <div>
          <AdminSectionTitle>{t("applications.details.skills")}</AdminSectionTitle>
          <SkillBadges skills={app.skills} />
        </div>

        {app.coverLetter && (
          <div>
            <AdminSectionTitle>{t("applications.details.coverLetter")}</AdminSectionTitle>
            <AdminTextBlock>{app.coverLetter}</AdminTextBlock>
          </div>
        )}

        {(app.experience || app.education) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {app.experience && (
              <div>
                <AdminSectionTitle>{t("applications.details.experience")}</AdminSectionTitle>
                <AdminTextBlock>{app.experience}</AdminTextBlock>
              </div>
            )}
            {app.education && (
              <div>
                <AdminSectionTitle>{t("applications.details.education")}</AdminSectionTitle>
                <AdminTextBlock>{app.education}</AdminTextBlock>
              </div>
            )}
          </div>
        )}

        {app.notes && (
          <div>
            <AdminSectionTitle>{t("applications.details.notes")}</AdminSectionTitle>
            <div className="text-sm text-warning bg-warning/10 p-3 rounded-card border border-warning/30 whitespace-pre-line">
              {app.notes}
            </div>
          </div>
        )}

        <div>
          <AdminSectionTitle>{t("applications.details.resume")}</AdminSectionTitle>
          {hasResume ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-card bg-tint border border-tint-line">
              <div className="flex items-center gap-2 min-w-0">
                <FiFileText className="w-5 h-5 text-primary-text shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-ink truncate">
                  {app.resumePath ? app.resumePath.split(/[/\\]/).pop() : "resume.pdf"}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => onDownload(app)}
                loading={downloadLoading}
                leftIcon={<FiDownload className="w-3.5 h-3.5" />}
              >
                {t("applications.details.downloadFile")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted italic">{t("applications.details.noResumeFile")}</p>
          )}
        </div>
      </div>

      <AdminModalActions justify="between">
        <Button size="sm" onClick={() => onChangeStatus(app)} leftIcon={<FiEdit2 className="w-4 h-4" />}>
          {t("applications.details.changeStatus")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t("common:actions.close")}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};

export default ApplicationDetailsModal;
