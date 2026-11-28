import React from "react";
import { Link } from "react-router-dom";
import {
  FiMapPin,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiMoreVertical,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "../../../components/ui";
import { useEnumLabel, useLocale } from "../../../i18n/helpers";

const MENU_ITEM = "flex w-full items-center space-x-2.5 px-4 py-2 text-xs font-semibold transition-colors";

/** Per-row actions dropdown (applicants, edit, lifecycle status changes, delete). */
const JobActionMenu = ({ job, onStatusChange, onDelete }) => {
  const { t } = useTranslation("employer");
  return (
    <div
      role="menu"
      className="absolute right-0 z-30 mt-2 w-56 rounded-card border border-line-strong bg-surface py-1 text-left shadow-card"
    >
      <Link
        to={`/employer/jobs/${job.id}/applicants`}
        role="menuitem"
        className={`${MENU_ITEM} text-ink hover:bg-tint`}
      >
        <FiUsers className="h-4 w-4 text-primary-text" aria-hidden="true" />
        <span>{t("manageJobs.menu.viewApplicants", { n: job.applicationsCount })}</span>
      </Link>
      <Link
        to={`/employer/jobs/${job.id}/edit`}
        role="menuitem"
        className={`${MENU_ITEM} text-ink hover:bg-tint`}
      >
        <FiEdit2 className="h-4 w-4 text-primary-text" aria-hidden="true" />
        <span>{t("manageJobs.menu.edit")}</span>
      </Link>

      <div className="my-1 border-t border-line" />
      <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
        {t("manageJobs.menu.changeStatus")}
      </div>
      {job.status !== "active" && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onStatusChange(job.id, "active")}
          className={`${MENU_ITEM} text-success hover:bg-success/10`}
        >
          <FiCheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("manageJobs.menu.setActive")}</span>
        </button>
      )}
      {job.status !== "Draft" && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onStatusChange(job.id, "Draft")}
          className={`${MENU_ITEM} text-warning hover:bg-warning/10`}
        >
          <FiClock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("manageJobs.menu.moveToDraft")}</span>
        </button>
      )}
      {job.status !== "Closed" && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onStatusChange(job.id, "Closed")}
          className={`${MENU_ITEM} text-ink hover:bg-tint`}
        >
          <FiXCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("manageJobs.menu.closeJob")}</span>
        </button>
      )}

      <div className="my-1 border-t border-line" />
      <button
        type="button"
        role="menuitem"
        onClick={() => onDelete(job)}
        className={`${MENU_ITEM} text-danger hover:bg-danger/10`}
      >
        <FiTrash2 className="h-4 w-4" aria-hidden="true" />
        <span>{t("manageJobs.menu.delete")}</span>
      </button>
    </div>
  );
};

/** Jobs table: position, type & level, status, application volume, timeline and actions. */
const ManageJobsTable = ({
  jobs,
  statusUpdatingId,
  actionMenuJobId,
  onToggleMenu,
  onStatusChange,
  onDelete,
}) => {
  const { t } = useTranslation("employer");
  const label = useEnumLabel();
  const locale = useLocale();
  const shortDate = (value, withYear = false) =>
    new Date(value).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line-strong text-[11px] font-bold uppercase tracking-wider text-muted">
            <th className="px-6 py-3.5">{t("manageJobs.table.position")}</th>
            <th className="px-6 py-3.5">{t("manageJobs.table.typeLevel")}</th>
            <th className="px-6 py-3.5">{t("manageJobs.table.status")}</th>
            <th className="px-6 py-3.5">{t("manageJobs.table.applications")}</th>
            <th className="px-6 py-3.5">{t("manageJobs.table.timeline")}</th>
            <th className="px-6 py-3.5 text-right">{t("manageJobs.table.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-sm">
          {jobs.map((job) => {
            const isMenuOpen = actionMenuJobId === job.id;
            return (
              <tr key={job.id} data-testid="employer-job-row" className="transition-colors hover:bg-tint">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <Link
                      to={`/employer/jobs/${job.id}/applicants`}
                      className="block text-base font-bold text-ink transition-colors hover:text-primary-text"
                    >
                      {job.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="font-semibold text-ink">{job.company}</span>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center space-x-1">
                        <FiMapPin className="h-3 w-3" aria-hidden="true" />
                        <span>{job.location}</span>
                      </span>
                      {job.salary && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="flex items-center space-x-1">
                            <FiDollarSign className="h-3 w-3 text-success" aria-hidden="true" />
                            <span>{job.salary}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="font-semibold text-ink">{label("jobType", job.type)}</p>
                  <p className="mt-0.5 text-xs text-muted">{label("experienceLevel", job.experience)}</p>
                </td>

                <td className="px-6 py-4">
                  <div className="inline-flex items-center space-x-2">
                    <StatusBadge group="jobStatus" value={job.status || "active"} />
                    {statusUpdatingId === job.id && (
                      <FiRefreshCw className="h-3.5 w-3.5 animate-spin text-primary-text" aria-hidden="true" />
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <Link
                      to={`/employer/jobs/${job.id}/applicants`}
                      className="inline-flex items-center space-x-1.5 font-bold text-ink transition-colors hover:text-primary-text"
                    >
                      <FiUsers className="h-4 w-4 text-primary-text" aria-hidden="true" />
                      <span>{job.applicationsCount}</span>
                      <span className="text-xs font-normal text-muted">{t("manageJobs.table.total")}</span>
                    </Link>
                    {job.pendingCount > 0 ? (
                      <p className="text-[11px] font-semibold text-warning">
                        {t("manageJobs.table.awaitingReview", { n: job.pendingCount })}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted">{t("manageJobs.table.noPending")}</p>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-1 text-xs text-muted">
                    <div className="flex items-center space-x-1">
                      <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {t("manageJobs.table.posted", { date: shortDate(job.createdAt || job.postedDate) })}
                      </span>
                    </div>
                    {job.applicationDeadline && (
                      <div className="text-[11px]">
                        {t("manageJobs.table.deadline", { date: shortDate(job.applicationDeadline, true) })}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="action-menu-container relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => onToggleMenu(isMenuOpen ? null : job.id)}
                      className="rounded-control p-2 text-muted transition-colors hover:bg-tint hover:text-ink"
                      aria-label={t("manageJobs.table.actionsMenu")}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                    >
                      <FiMoreVertical className="h-5 w-5" />
                    </button>
                    {isMenuOpen && (
                      <JobActionMenu job={job} onStatusChange={onStatusChange} onDelete={onDelete} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ManageJobsTable;
