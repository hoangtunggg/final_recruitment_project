import { useTranslation } from "react-i18next";
import { Button, Select, Textarea } from "../../ui";
import { useEnumLabel } from "../../../i18n/helpers";
import AdminModal, { AdminModalActions } from "../shared/AdminModal";
import { APPLICATION_STATUSES } from "./application-status-options";

/** Update-status dialog. Props: application, status, setStatus, notes, setNotes, loading, onCancel, onConfirm. */
const ApplicationStatusModal = ({
  application,
  status,
  setStatus,
  notes,
  setNotes,
  loading,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  return (
    <AdminModal label={t("applications.statusModal.aria")} size="sm">
      <h3 className="text-lg font-bold text-ink mb-2">{t("applications.statusModal.title")}</h3>
      <p className="text-sm text-muted mb-4">
        {t("applications.statusModal.intro", { name: application.applicantName })}
      </p>
      <div className="space-y-4 mb-4">
        <Select
          label={t("applications.statusModal.pipelineStatus")}
          required
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {APPLICATION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label("applicationStatus", value)}
            </option>
          ))}
        </Select>
        <Textarea
          label={t("applications.statusModal.notes")}
          rows={3}
          placeholder={t("applications.statusModal.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <AdminModalActions>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          {t("common:actions.cancel")}
        </Button>
        <Button size="sm" onClick={onConfirm} loading={loading}>
          {t("applications.statusModal.confirm")}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};

export default ApplicationStatusModal;
