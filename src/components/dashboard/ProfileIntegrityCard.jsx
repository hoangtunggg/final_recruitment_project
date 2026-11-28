import React from "react";
import { useTranslation } from "react-i18next";
import { FiCalendar, FiCheckCircle, FiFileText, FiInfo, FiMail, FiShield, FiTag, FiUser } from "react-icons/fi";
import { Badge, Card } from "../ui";
import { useEnumLabel, useLocale } from "../../i18n/helpers";
import { parseCandidateSkills } from "./candidate-dashboard-insights";

const Field = ({ label, icon, children }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
    <dd className="mt-1 flex items-center gap-1.5 break-words font-semibold text-ink">
      {icon && <span className="shrink-0 text-muted" aria-hidden="true">{icon}</span>}
      <span className="min-w-0 break-all">{children}</span>
    </dd>
  </div>
);

/** Read-only summary of the candidate account (name, email, role, default resume, skills). */
const ProfileIntegrityCard = ({ user }) => {
  const { t } = useTranslation("candidate");
  const enumLabel = useEnumLabel();
  const locale = useLocale();
  if (!user) return null;

  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale, { month: "long", year: "numeric" }) : null;
  const skills = parseCandidateSkills(user.skills, { lowerCase: false });

  return (
    <Card as="section" padding="md" aria-labelledby="profile-card-title">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 id="profile-card-title" className="flex items-center gap-2 text-xl font-bold text-ink">
            <FiUser className="text-primary-text" aria-hidden="true" />
            {t("profile.title")}
          </h2>
          <p className="mt-1 text-muted">{t("profile.subtitle")}</p>
        </div>
        <Badge tone="success" icon={<FiCheckCircle />}>
          {t("profile.active")}
        </Badge>
      </div>

      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("profile.name")}>{user.name || t("profile.na")}</Field>
        <Field label="Email" icon={<FiMail />}>{user.email}</Field>
        <Field label={t("profile.role")} icon={<FiShield />}>{enumLabel("userRole", user.role)}</Field>
        {user.phone && <Field label={t("profile.phone")}>{user.phone}</Field>}
        {joined && <Field label={t("profile.memberSince")} icon={<FiCalendar />}>{joined}</Field>}
        <Field label={t("profile.defaultResume")} icon={<FiFileText />}>{user.resumePath || t("profile.noResume")}</Field>
      </dl>

      {skills.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{t("profile.skills")}</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} tone="primary" icon={<FiTag />}>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 rounded-control bg-tint p-3 text-sm text-muted">
        <FiInfo className="mt-0.5 shrink-0" aria-hidden="true" />
        {t("profile.notice")}
      </p>
    </Card>
  );
};

export default ProfileIntegrityCard;
