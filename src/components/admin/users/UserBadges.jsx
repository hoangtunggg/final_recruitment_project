import { useTranslation } from "react-i18next";
import { Badge } from "../../ui";
import { useEnumLabel } from "../../../i18n/helpers";

const ROLE_TONES = { admin: "primary", employer: "info", jobseeker: "success" };
const STATUS_TONES = { active: "success", inactive: "warning", blocked: "danger" };

/** Role chip; the API value (admin | employer | jobseeker) is only translated for display. */
export const UserRoleBadge = ({ role, size = "sm" }) => {
  const label = useEnumLabel();
  if (!role) return null;
  return (
    <Badge tone={ROLE_TONES[role] || "neutral"} size={size}>
      {label("userRole", role)}
    </Badge>
  );
};

/** Account status chip (active | inactive | blocked). */
export const UserStatusBadge = ({ status, size = "sm" }) => {
  const { t } = useTranslation("admin");
  if (!status) return null;
  return (
    <Badge tone={STATUS_TONES[status] || "neutral"} size={size} dot>
      {t(`users.status.${status}`, { defaultValue: status })}
    </Badge>
  );
};
