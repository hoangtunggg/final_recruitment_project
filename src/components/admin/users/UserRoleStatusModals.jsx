import { useTranslation } from "react-i18next";
import { Button, Select } from "../../ui";
import { useEnumLabel } from "../../../i18n/helpers";
import AdminModal, { AdminModalActions } from "../shared/AdminModal";
import { AdminCallout } from "../shared/AdminDetailParts";

const ROLES = ["jobseeker", "employer", "admin"];
const STATUSES = ["active", "inactive", "blocked"];

/**
 * Change-role dialog. Props: user, role, setRole, loading, onCancel, onConfirm.
 * Confirm stays disabled until a different role is picked.
 */
export const UserRoleModal = ({ user, role, setRole, loading, onCancel, onConfirm }) => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  return (
    <AdminModal label={t("users.roleModal.aria")} size="sm">
      <h3 className="text-lg font-bold text-ink mb-2">{t("users.roleModal.title")}</h3>
      <p className="text-sm text-muted mb-4">
        {t("users.roleModal.intro", { name: user.name, email: user.email })}
      </p>
      <div className="mb-4">
        <Select label={t("users.roleModal.label")} value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {label("userRole", value)}
            </option>
          ))}
        </Select>
      </div>
      {role === "admin" && <AdminCallout>{t("users.roleModal.adminWarning")}</AdminCallout>}
      <AdminModalActions>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          {t("common:actions.cancel")}
        </Button>
        <Button size="sm" onClick={onConfirm} loading={loading} disabled={role === user.role}>
          {t("users.roleModal.confirm")}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};

/** Change-status dialog. Props: user, status, setStatus, loading, onCancel, onConfirm. */
export const UserStatusModal = ({ user, status, setStatus, loading, onCancel, onConfirm }) => {
  const { t } = useTranslation("admin");
  return (
    <AdminModal label={t("users.statusModal.aria")} size="sm">
      <h3 className="text-lg font-bold text-ink mb-2">{t("users.statusModal.title")}</h3>
      <p className="text-sm text-muted mb-4">{t("users.statusModal.intro", { name: user.name })}</p>
      <div className="mb-4">
        <Select
          label={t("users.statusModal.label")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`users.statusModal.options.${value}`)}
            </option>
          ))}
        </Select>
      </div>
      {status === "blocked" && (
        <AdminCallout tone="danger">{t("users.statusModal.blockedWarning")}</AdminCallout>
      )}
      <AdminModalActions>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          {t("common:actions.cancel")}
        </Button>
        <Button size="sm" onClick={onConfirm} loading={loading} disabled={status === user.status}>
          {t("users.statusModal.confirm")}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};
