import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui";

// Audit action codes come from the API (e.g. ROLE_CHANGE); only the label is translated.
const toneForAction = (action = "") => {
  if (action.includes("DELETE") || action.includes("BLOCK")) return "danger";
  if (action.includes("CREATE") || action.includes("REGISTER") || action.includes("SUBMIT")) {
    return "success";
  }
  if (action.includes("ROLE") || action.includes("STATUS") || action.includes("UPDATE")) {
    return "primary";
  }
  return "neutral";
};

/** Translated label for an audit action code; unknown codes fall back to "CODE WITH SPACES". */
const useAuditActionLabel = () => {
  const { t } = useTranslation("adminOps");
  return (action) =>
    action
      ? t(`auditActions.${action}`, { defaultValue: String(action).replace(/_/g, " ") })
      : t("dashboard.audit.fallbackAction");
};

const AuditActionBadge = ({ action, className = "" }) => {
  const label = useAuditActionLabel();
  return (
    <Badge tone={toneForAction(action)} size="sm" className={className}>
      {label(action)}
    </Badge>
  );
};

export default AuditActionBadge;
