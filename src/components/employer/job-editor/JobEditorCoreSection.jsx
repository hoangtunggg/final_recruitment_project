import React from "react";
import { FiBriefcase, FiMapPin, FiDollarSign } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card, Input, Select } from "../../ui";
import { useEnumLabel } from "../../../i18n/helpers";
import { JOB_TYPES, EXPERIENCE_LEVELS, STATUS_OPTIONS, STATUS_HINT_KEY } from "./job-editor-options";

/** Section 1: title, company, location, type, experience, salary, deadline and status picker. */
const JobEditorCoreSection = ({ formData, errors, onChange, onBlur, onStatusChange }) => {
  const { t } = useTranslation("employer");
  const label = useEnumLabel();

  return (
    <Card className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="flex items-center space-x-2 text-lg font-extrabold text-ink">
          <FiBriefcase className="text-primary-text" aria-hidden="true" />
          <span>{t("jobEditor.core.title")}</span>
        </h2>
        <p className="mt-0.5 text-sm text-muted">{t("jobEditor.core.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          className="md:col-span-2"
          label={t("jobEditor.fields.title")}
          required
          name="title"
          value={formData.title}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={100}
          placeholder={t("jobEditor.fields.titlePlaceholder")}
          error={errors.title}
          hint={`${formData.title.length}/100`}
        />
        <Input
          label={t("jobEditor.fields.company")}
          required
          name="company"
          value={formData.company}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={100}
          placeholder={t("jobEditor.fields.companyPlaceholder")}
          error={errors.company}
        />
        <Input
          label={t("jobEditor.fields.location")}
          required
          name="location"
          leftIcon={<FiMapPin />}
          value={formData.location}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={100}
          placeholder={t("jobEditor.fields.locationPlaceholder")}
          error={errors.location}
        />
        <Select
          label={t("jobEditor.fields.type")}
          required
          name="type"
          value={formData.type}
          onChange={onChange}
        >
          {JOB_TYPES.map((value) => (
            <option key={value} value={value}>
              {label("jobType", value)}
            </option>
          ))}
        </Select>
        <Select
          label={t("jobEditor.fields.experience")}
          required
          name="experience"
          value={formData.experience}
          onChange={onChange}
        >
          {EXPERIENCE_LEVELS.map((value) => (
            <option key={value} value={value}>
              {label("experienceLevel", value)}
            </option>
          ))}
        </Select>
        <Input
          label={t("jobEditor.fields.salary")}
          name="salary"
          leftIcon={<FiDollarSign />}
          value={formData.salary}
          onChange={onChange}
          maxLength={100}
          placeholder={t("jobEditor.fields.salaryPlaceholder")}
        />
        <Input
          label={t("jobEditor.fields.deadline")}
          type="date"
          name="applicationDeadline"
          value={formData.applicationDeadline}
          onChange={onChange}
          min={new Date().toISOString().split("T")[0]}
        />

        <fieldset className="md:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-ink">
            {t("jobEditor.fields.status")} <span className="text-danger">*</span>
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {STATUS_OPTIONS.map((value) => {
              const selected = formData.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  data-testid={`job-status-${value}`}
                  onClick={() => onStatusChange(value)}
                  className={`rounded-card border p-3 text-left transition-colors ${
                    selected
                      ? "border-primary-500 bg-tint text-primary-text ring-2 ring-primary-500/20"
                      : "border-line bg-surface text-ink hover:bg-tint"
                  }`}
                >
                  <span className="block text-sm font-bold">{label("jobStatus", value)}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t(`jobEditor.statusHint.${STATUS_HINT_KEY[value]}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </Card>
  );
};

export default JobEditorCoreSection;
