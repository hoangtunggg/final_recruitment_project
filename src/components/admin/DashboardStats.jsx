import React from "react";
import { useTranslation } from "react-i18next";
import {
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiActivity,
  FiUserCheck,
  FiShield,
} from "react-icons/fi";
import { Badge, Card } from "../ui";
import { useLocale } from "../../i18n/helpers";

const MiniStat = ({ label, value, tone }) => (
  <div className={`p-2 rounded-md border ${tone.box}`}>
    <p className="text-xs text-muted">{label}</p>
    <p className={`text-lg font-bold ${tone.value}`}>{value}</p>
  </div>
);

const TONE_BRAND = { box: "bg-tint border-tint-line", value: "text-primary-text" };
const TONE_WARM = { box: "bg-warning/10 border-warning/30", value: "text-warning" };
const TONE_OK = { box: "bg-success/10 border-success/30", value: "text-success" };
const TONE_NEUTRAL = { box: "bg-tint border-line", value: "text-ink" };
const TONE_BAD = { box: "bg-danger/10 border-danger/30", value: "text-danger" };

const DashboardStats = ({ stats, loading = false }) => {
  const { t } = useTranslation("adminOps");
  const locale = useLocale();
  const fmt = (n) => (n ?? 0).toLocaleString(locale);

  const roleCount = (role) => stats?.roleStats?.find((r) => r.role === role)?.count ?? 0;
  const jobSeekersCount = roleCount("jobseeker");
  const employersCount = roleCount("employer");
  const adminsCount = roleCount("admin");

  const statsData = [
    {
      id: 1,
      name: t("dashboard.stats.totalJobs"),
      value: fmt(stats?.totalJobs),
      icon: FiBriefcase,
      badgeText: t("dashboard.stats.jobsBadge"),
      badgeTone: "primary",
      description: t("dashboard.stats.jobsDesc"),
    },
    {
      id: 2,
      name: t("dashboard.stats.totalUsers"),
      value: fmt(stats?.totalUsers),
      icon: FiUsers,
      badgeText: t("dashboard.stats.activeBadge", { n: fmt(stats?.activeUsers) }),
      badgeTone: "success",
      description: t("dashboard.stats.usersDesc", {
        seekers: fmt(jobSeekersCount),
        employers: fmt(employersCount),
      }),
    },
    {
      id: 3,
      name: t("dashboard.stats.totalApplications"),
      value: fmt(stats?.totalApplications),
      icon: FiFileText,
      badgeText: t("dashboard.stats.appsBadge"),
      badgeTone: "primary",
      description: t("dashboard.stats.appsDesc"),
    },
    {
      id: 4,
      name: t("dashboard.stats.recentTitle"),
      value: fmt(stats?.recentActivity),
      icon: FiActivity,
      badgeText: t("dashboard.stats.recentBadge"),
      badgeTone: "neutral",
      description: t("dashboard.stats.recentDesc"),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-5 xl:grid-cols-4" aria-busy="true">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} padding="md" className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-tint rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-tint rounded w-1/2"></div>
                <div className="h-6 bg-tint rounded w-3/4"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.id} padding="sm" className="sm:p-5 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-lg bg-tint text-primary-text">
                <stat.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <Badge tone={stat.badgeTone} size="sm">
                {stat.badgeText}
              </Badge>
            </div>

            <div className="mt-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                {stat.name}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-ink">{stat.value}</dd>
              <p className="mt-1 text-sm text-muted">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center">
              <FiShield className="mr-1.5 text-primary-text" />
              {t("dashboard.stats.roleTitle")}
            </h3>
            <span className="text-[11px] text-muted">{t("dashboard.stats.roleHint")}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label={t("dashboard.stats.seekers")} value={fmt(jobSeekersCount)} tone={TONE_BRAND} />
            <MiniStat label={t("dashboard.stats.employers")} value={fmt(employersCount)} tone={TONE_WARM} />
            <MiniStat label={t("dashboard.stats.admins")} value={fmt(adminsCount)} tone={TONE_BRAND} />
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center">
              <FiUserCheck className="mr-1.5 text-success" />
              {t("dashboard.stats.statusTitle")}
            </h3>
            <span className="text-[11px] text-muted">{t("dashboard.stats.statusHint")}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label={t("userStatus.active")} value={fmt(stats?.activeUsers)} tone={TONE_OK} />
            <MiniStat label={t("userStatus.inactive")} value={fmt(stats?.inactiveUsers)} tone={TONE_NEUTRAL} />
            <MiniStat label={t("userStatus.blocked")} value={fmt(stats?.blockedUsers)} tone={TONE_BAD} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
