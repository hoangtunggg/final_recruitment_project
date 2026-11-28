import { useTranslation } from "react-i18next";
import { FiBriefcase, FiCalendar, FiGlobe, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Badge, Button, Spinner, StatusBadge } from "../../ui";
import { useLocale } from "../../../i18n/helpers";
import AdminModal, { AdminModalActions, AdminModalHeader } from "../shared/AdminModal";
import {
  AdminAvatar,
  AdminInfoItem,
  AdminSectionTitle,
} from "../shared/AdminDetailParts";
import { UserRoleBadge, UserStatusBadge } from "./UserBadges";

// The API may return JSON columns as strings.
const safeParseJSON = (data) => {
  if (!data) return null;
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Account details dialog. Props: user (row from the list), details (full profile or null),
 * activity (GET user activity payload or null), loading, onClose.
 */
const UserDetailsModal = ({ user, details, activity, loading, onClose }) => {
  const { t } = useTranslation("admin");
  const locale = useLocale();
  const notProvided = t("shared.notProvided");
  const notSpecified = t("shared.notSpecified");

  const employer = details ? safeParseJSON(details.employerDetails) || {} : {};
  const skills = details
    ? Array.isArray(details.skills)
      ? details.skills
      : safeParseJSON(details.skills) || []
    : [];
  const website = employer.website || user.website;
  const applications = activity?.activity?.applications || [];

  return (
    <AdminModal label={t("users.details.aria")}>
      <AdminModalHeader
        leading={<AdminAvatar name={user.name} />}
        title={user.name}
        subtitle={t("users.details.subtitle", { id: user.id })}
        onClose={onClose}
      />

      {loading ? (
        <div className="py-12 text-center text-primary-text">
          <Spinner size="md" label={t("users.details.loading")} className="mb-2" />
          <p className="text-sm text-muted" aria-hidden="true">
            {t("users.details.loading")}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-tint p-4 rounded-card">
            <AdminInfoItem label={t("users.details.email")} icon={<FiMail className="w-3.5 h-3.5" />}>
              {user.email}
            </AdminInfoItem>
            <AdminInfoItem label={t("users.details.phone")} icon={<FiPhone className="w-3.5 h-3.5" />}>
              {details?.phone || user.phone || notProvided}
            </AdminInfoItem>
            <AdminInfoItem label={t("users.details.location")} icon={<FiMapPin className="w-3.5 h-3.5" />}>
              {details?.location || user.location || notProvided}
            </AdminInfoItem>
            <AdminInfoItem label={t("users.details.memberSince")} icon={<FiCalendar className="w-3.5 h-3.5" />}>
              {new Date(user.createdAt).toLocaleDateString(locale)}
            </AdminInfoItem>
            <AdminInfoItem label={t("users.details.role")}>
              <UserRoleBadge role={user.role} />
            </AdminInfoItem>
            <AdminInfoItem label={t("users.details.status")}>
              <UserStatusBadge status={user.status} />
            </AdminInfoItem>
          </div>

          {(details?.bio || user.bio) && (
            <div>
              <AdminSectionTitle>{t("users.details.bio")}</AdminSectionTitle>
              <p className="text-sm text-ink bg-tint p-3 rounded-card">{details?.bio || user.bio}</p>
            </div>
          )}

          {user.role === "employer" && (
            <div>
              <AdminSectionTitle>{t("users.details.companyProfile")}</AdminSectionTitle>
              <div className="grid grid-cols-2 gap-3 bg-tint p-3.5 rounded-card border border-tint-line">
                <AdminInfoItem label={t("users.details.companyName")}>
                  {employer.company || user.company || notSpecified}
                </AdminInfoItem>
                <AdminInfoItem label={t("users.details.industry")}>
                  {employer.industry || notSpecified}
                </AdminInfoItem>
                <AdminInfoItem label={t("users.details.companySize")}>
                  {employer.companySize || notSpecified}
                </AdminInfoItem>
                <AdminInfoItem label={t("users.details.website")}>
                  {website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-text hover:underline flex items-center gap-1"
                    >
                      <FiGlobe className="w-3.5 h-3.5" aria-hidden="true" />
                      {website}
                    </a>
                  ) : (
                    notSpecified
                  )}
                </AdminInfoItem>
              </div>
            </div>
          )}

          {user.role === "jobseeker" && (
            <div>
              <AdminSectionTitle>{t("users.details.skills")}</AdminSectionTitle>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <Badge key={idx} tone="primary" size="sm">
                      {typeof skill === "string" ? skill : skill.name || JSON.stringify(skill)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted italic">{t("users.details.noSkills")}</p>
              )}
            </div>
          )}

          <div>
            <AdminSectionTitle>{t("users.details.applicationHistory")}</AdminSectionTitle>
            {applications.length > 0 ? (
              <div className="space-y-2">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-card bg-tint border border-line text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiBriefcase className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {app.job?.title || t("users.details.jobFallback", { id: app.jobId })}
                        </p>
                        {app.job?.company && <p className="text-xs text-muted">{app.job.company}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge group="applicationStatus" value={app.status} />
                      <p className="text-[11px] text-muted mt-0.5">
                        {new Date(app.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted italic">{t("users.details.noApplications")}</p>
            )}
          </div>
        </div>
      )}

      <AdminModalActions>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t("common:actions.close")}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};

export default UserDetailsModal;
