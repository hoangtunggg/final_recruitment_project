import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowRight, FiBookmark, FiBriefcase, FiCalendar, FiCheckCircle, FiMic, FiUpload } from "react-icons/fi";
import { Button, Card } from "../ui";

const KPIS = [
  { id: "applications", stat: "applied", icon: FiBriefcase, tab: "applications", filter: "all" },
  { id: "interviews", stat: "interviews", icon: FiCalendar, tab: "applications", filter: "interview" },
  { id: "offers", stat: "offers", icon: FiCheckCircle, tab: "applications", filter: "offered" },
  { id: "saved", stat: "saved", icon: FiBookmark, tab: "saved" },
];

/** Welcome banner (with the AI interview shortcut) and the four KPI cards that jump to a tab. */
const DashboardHeader = ({ user, stats, onTabChange }) => {
  const { t } = useTranslation("candidate");
  const name = user?.name || t("header.fallbackName");
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mb-8 space-y-6">
      <Card padding="md">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-extrabold leading-tight text-ink">
                {t("header.welcome", { name })}
              </h1>
              <p className="mt-1 break-all text-sm text-muted">{user?.email}</p>
              <p className="mt-0.5 text-sm text-muted">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button as={Link} to="/interview" leftIcon={<FiMic />} data-testid="dashboard-interview-cta">
              {t("header.interviewCta")}
            </Button>
            <Button variant="outline" leftIcon={<FiUpload />} onClick={() => onTabChange("resumes")}>
              {t("header.manageResumes")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((kpi) => {
          const { id, stat, tab, filter } = kpi;
          const Icon = kpi.icon;
          return (
          <Card
            key={id}
            as="button"
            type="button"
            interactive
            padding="md"
            onClick={() => (filter ? onTabChange(tab, filter) : onTabChange(tab))}
            className="group min-h-32 text-left"
            data-testid={`kpi-${id}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{t(`kpi.${id}.label`)}</span>
                <span className="mt-1 block text-3xl font-extrabold text-ink">{stats?.[stat] ?? 0}</span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint text-lg text-primary-text" aria-hidden="true">
                <Icon />
              </span>
            </span>
            <span className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm font-semibold text-primary-text">
              {t(`kpi.${id}.hint`)}
              <FiArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHeader;
