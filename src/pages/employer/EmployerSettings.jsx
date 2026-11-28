import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiBriefcase,
  FiShield,
  FiKey,
  FiCheckCircle,
  FiInfo,
  FiArrowRight,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import CompanyProfileEditor from "../../components/employer/CompanyProfileEditor";
import { Card, Input, PageHeader } from "../../components/ui";
import { useEnumLabel } from "../../i18n/helpers";

const TABS = [
  { id: "profile", icon: FiUser },
  { id: "organization", icon: FiBriefcase },
  { id: "security", icon: FiShield },
];

const CHIP_TONES = {
  primary: "bg-tint text-primary-text",
  success: "bg-success/10 text-success",
};

/** One permission / security row: title + description on the left, status chip on the right. */
const InfoRow = ({ icon: Icon, title, description, chip, tone = "success" }) => (
  <div className="flex items-center justify-between rounded-card border border-line bg-tint/50 p-4">
    <div className="flex items-center space-x-3">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-tint text-primary-text">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </div>
    <span className={`ml-3 shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold ${CHIP_TONES[tone]}`}>
      {chip}
    </span>
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div>
    <h2 className="text-base font-extrabold text-ink">{title}</h2>
    <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
  </div>
);

const EmployerSettings = () => {
  const { t } = useTranslation(["employer", "common"]);
  const label = useEnumLabel();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(String(user.id));
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const displayName =
    user?.name ||
    user?.company ||
    (user?.email ? user.email.split("@")[0] : t("employer:layout.employerFallback"));
  const displayEmail = user?.email || "employer@example.com";
  const displayRole = label("userRole", user?.role || "employer");
  const displayCompany = user?.company || t("employer:settings.organizationFallback");

  const shortcuts = [
    { to: "/employer/post-job", key: "postJob" },
    { to: "/employer/jobs", key: "manageJobs" },
    { to: "/employer/applicants", key: "trackApplicants" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("employer:settings.title")} subtitle={t("employer:settings.subtitle")} />

      <div className="flex items-start space-x-3 rounded-card border border-tint-line bg-tint p-4 text-sm text-primary-text">
        <FiInfo className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">{t("employer:settings.mediaTitle")}</strong>{" "}
          {t("employer:settings.mediaText")}
        </p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-line px-4 sm:px-6">
          <nav className="flex space-x-4 overflow-x-auto sm:space-x-8" aria-label={t("employer:settings.title")}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={selected ? "page" : undefined}
                  className={`flex shrink-0 items-center space-x-2 border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-primary-500 text-primary-text"
                      : "border-transparent text-muted hover:border-line-strong hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{t(`employer:settings.tabs.${tab.id}`)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <SectionTitle
                title={t("employer:settings.profile.title")}
                subtitle={t("employer:settings.profile.subtitle")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={t("employer:settings.profile.name")} value={displayName} readOnly />
                <Input label={t("employer:settings.profile.email")} type="email" value={displayEmail} readOnly />
                <div className="flex items-end space-x-2">
                  <Input
                    className="flex-1"
                    label={t("employer:settings.profile.userId")}
                    value={user?.id || "N/A"}
                    readOnly
                    inputClassName="font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line text-muted transition-colors hover:bg-tint hover:text-ink"
                    title={t("employer:settings.profile.copyId")}
                    aria-label={t("employer:settings.profile.copyId")}
                  >
                    {copiedId ? <FiCheck className="h-4 w-4 text-success" /> : <FiCopy className="h-4 w-4" />}
                  </button>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-ink">{t("employer:settings.profile.status")}</p>
                  <div className="flex min-h-11 items-center space-x-2 rounded-control border border-success/30 bg-success/10 px-3.5 text-sm font-semibold text-success">
                    <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
                    <span>{t("employer:settings.profile.statusValue")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "organization" && (
            <div className="max-w-3xl space-y-8">
              <CompanyProfileEditor user={user} />
              <div className="space-y-3 border-t border-line pt-7">
                <SectionTitle
                  title={t("employer:settings.org.title")}
                  subtitle={t("employer:settings.org.subtitle")}
                />
                <InfoRow
                  title={t("employer:settings.org.roleTitle", { role: displayRole })}
                  description={t("employer:settings.org.roleText")}
                  chip={t("employer:settings.org.granted")}
                  tone="primary"
                />
                <InfoRow
                  title={t("employer:settings.org.orgTitle")}
                  description={displayCompany}
                  chip={t("employer:settings.org.associated")}
                />
                <InfoRow
                  title={t("employer:settings.org.dataTitle")}
                  description={t("employer:settings.org.dataText")}
                  chip={t("employer:settings.org.enforced")}
                  tone="primary"
                />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="max-w-2xl space-y-6">
              <SectionTitle
                title={t("employer:settings.security.title")}
                subtitle={t("employer:settings.security.subtitle")}
              />
              <div className="space-y-3">
                <InfoRow
                  icon={FiKey}
                  title={t("employer:settings.security.jwtTitle")}
                  description={t("employer:settings.security.jwtText")}
                  chip={t("employer:settings.security.active")}
                />
                <InfoRow
                  icon={FiShield}
                  title={t("employer:settings.security.passwordTitle")}
                  description={t("employer:settings.security.passwordText")}
                  chip={t("employer:settings.security.secured")}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-extrabold text-ink">{t("employer:settings.shortcuts.title")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {shortcuts.map(({ to, key }) => (
            <Link
              key={key}
              to={to}
              className="group flex items-center justify-between rounded-card border border-line p-3 transition-colors hover:bg-tint"
            >
              <span className="text-xs font-semibold text-ink group-hover:text-primary-text">
                {t(`employer:settings.shortcuts.${key}`)}
              </span>
              <FiArrowRight className="h-3.5 w-3.5 text-muted group-hover:text-primary-text" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default EmployerSettings;
