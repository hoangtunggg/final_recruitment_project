import { useTranslation } from "react-i18next";
import { Button } from "../../ui";
import AdminModal from "../shared/AdminModal";
import JobFormFields from "./JobFormFields";

/**
 * Edit / add job dialog. Props: mode "edit" | "add", formData, setFormData, onSubmit(event),
 * onClose, loading.
 */
const JobFormModal = ({ mode, formData, setFormData, onSubmit, onClose, loading }) => {
  const { t } = useTranslation("admin");
  const isEdit = mode === "edit";
  const title = t(isEdit ? "jobs.editModal.title" : "jobs.addModal.title");

  return (
    <AdminModal label={title}>
      <h3 className="text-lg font-bold text-ink mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <JobFormFields formData={formData} setFormData={setFormData} withModeration={isEdit} />
        <div className="flex justify-end gap-3 pt-3 border-t border-line">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" size="sm" loading={loading}>
            {t(isEdit ? "jobs.editModal.submit" : "jobs.addModal.submit")}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};

export default JobFormModal;
