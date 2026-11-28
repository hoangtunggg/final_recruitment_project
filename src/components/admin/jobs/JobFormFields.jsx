import { useTranslation } from "react-i18next";
import { Input, Select, Textarea } from "../../ui";
import { useEnumLabel } from "../../../i18n/helpers";
import {
  APPROVAL_STATUSES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
  JOB_TYPES,
} from "./job-form-options";

/**
 * Fields shared by the "edit job" and "add job" dialogs.
 * `withModeration` adds the listing-status and approval-status selects (edit only).
 */
const JobFormFields = ({ formData, setFormData, withModeration = false }) => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t("jobs.form.title")} required value={formData.title} onChange={set("title")} />
        <Input label={t("jobs.form.company")} required value={formData.company} onChange={set("company")} />
        <Input label={t("jobs.form.location")} required value={formData.location} onChange={set("location")} />
        <Input
          label={t("jobs.form.salary")}
          placeholder={t("jobs.form.salaryPlaceholder")}
          value={formData.salary}
          onChange={set("salary")}
        />
        <Select label={t("jobs.form.type")} value={formData.type} onChange={set("type")}>
          {JOB_TYPES.map((value) => (
            <option key={value} value={value}>
              {label("jobType", value)}
            </option>
          ))}
        </Select>
        <Select label={t("jobs.form.experience")} value={formData.experience} onChange={set("experience")}>
          {EXPERIENCE_LEVELS.map((value) => (
            <option key={value} value={value}>
              {label("experienceLevel", value)}
            </option>
          ))}
        </Select>
        {withModeration && (
          <>
            <Select label={t("jobs.form.listingStatus")} value={formData.status} onChange={set("status")}>
              {JOB_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label("jobStatus", value)}
                </option>
              ))}
            </Select>
            <Select
              label={t("jobs.form.approvalStatus")}
              value={formData.approvalStatus}
              onChange={set("approvalStatus")}
            >
              {APPROVAL_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {label("approvalStatus", value)}
                </option>
              ))}
            </Select>
          </>
        )}
      </div>
      <Textarea
        label={t("jobs.form.description")}
        required
        rows={4}
        value={formData.description}
        onChange={set("description")}
      />
      <Textarea
        label={t("jobs.form.requirements")}
        required
        rows={3}
        value={formData.requirements}
        onChange={set("requirements")}
      />
    </>
  );
};

export default JobFormFields;
