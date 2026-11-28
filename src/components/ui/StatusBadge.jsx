import { useEnumLabel } from "../../i18n/helpers";
import Badge from "./Badge";

// Tone per API enum value (application / job / approval statuses).
const STATUS_TONES = {
  applicationStatus: {
    pending: "warning",
    under_review: "info",
    shortlisted: "primary",
    interview_scheduled: "info",
    interviewed: "primary",
    offered: "success",
    accepted: "success",
    hired: "success",
    rejected: "danger",
    withdrawn: "neutral",
  },
  jobStatus: {
    active: "success",
    Published: "success",
    filled: "primary",
    Draft: "warning",
    inactive: "neutral",
    Closed: "neutral",
  },
  approvalStatus: { approved: "success", pending: "warning", rejected: "danger" },
};

/**
 * Translated badge for an API enum value; never alters the value itself.
 *   <StatusBadge group="applicationStatus" value={app.status} />
 * Props: group "applicationStatus" | "jobStatus" | "approvalStatus", value, size, className.
 * Unknown values render the raw value in a neutral badge.
 */
const StatusBadge = ({ group, value, size = "sm", className = "" }) => {
  const label = useEnumLabel();
  if (!value) return null;
  const tone = STATUS_TONES[group]?.[value] || "neutral";
  return (
    <Badge tone={tone} size={size} dot className={className}>
      {label(group, value)}
    </Badge>
  );
};

export default StatusBadge;
