import React from "react";
import { FiClock, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, Input, Textarea } from "../../ui";

export const MAX_SKILLS = 15;

/** Section 2: description, requirements, responsibilities, benefits and the skills tag input. */
const JobEditorDetailsSection = ({
  formData,
  errors,
  onChange,
  onBlur,
  skillsList,
  currentSkill,
  onCurrentSkillChange,
  onAddSkill,
  onRemoveSkill,
  onSkillKeyDown,
}) => {
  const { t } = useTranslation(["employer", "common"]);
  const counter = (current, max, min) =>
    t("employer:jobEditor.counterMin", { current, max, min });

  return (
    <Card className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="flex items-center space-x-2 text-lg font-extrabold text-ink">
          <FiClock className="text-primary-text" aria-hidden="true" />
          <span>{t("employer:jobEditor.details.title")}</span>
        </h2>
        <p className="mt-0.5 text-sm text-muted">{t("employer:jobEditor.details.subtitle")}</p>
      </div>

      <div className="space-y-6">
        <Textarea
          label={t("employer:jobEditor.fields.description")}
          required
          name="description"
          rows={5}
          value={formData.description}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={5000}
          placeholder={t("employer:jobEditor.fields.descriptionPlaceholder")}
          error={errors.description}
          hint={counter(formData.description.length, 5000, 30)}
        />
        <Textarea
          label={t("employer:jobEditor.fields.requirements")}
          required
          name="requirements"
          rows={4}
          value={formData.requirements}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={3000}
          placeholder={t("employer:jobEditor.fields.requirementsPlaceholder")}
          error={errors.requirements}
          hint={counter(formData.requirements.length, 3000, 20)}
        />
        <Textarea
          label={t("employer:jobEditor.fields.responsibilities")}
          name="responsibilities"
          rows={3}
          value={formData.responsibilities}
          onChange={onChange}
          maxLength={3000}
          placeholder={t("employer:jobEditor.fields.responsibilitiesPlaceholder")}
        />
        <Textarea
          label={t("employer:jobEditor.fields.benefits")}
          name="benefits"
          rows={3}
          value={formData.benefits}
          onChange={onChange}
          maxLength={2000}
          placeholder={t("employer:jobEditor.fields.benefitsPlaceholder")}
        />

        <div>
          <div className="flex items-end gap-2">
            <Input
              className="flex-1"
              label={t("employer:jobEditor.fields.skills", { max: MAX_SKILLS })}
              name="skillInput"
              value={currentSkill}
              onChange={(e) => onCurrentSkillChange(e.target.value)}
              onKeyDown={onSkillKeyDown}
              placeholder={t("employer:jobEditor.fields.skillsPlaceholder")}
              maxLength={30}
              error={errors.skills}
            />
            <Button
              variant="outline"
              onClick={onAddSkill}
              disabled={!currentSkill.trim() || skillsList.length >= MAX_SKILLS}
              className="shrink-0"
            >
              {t("common:actions.add")}
            </Button>
          </div>
          {skillsList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center space-x-1.5 rounded-pill border border-tint-line bg-tint px-3 py-1 text-xs font-semibold text-primary-text"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(skill)}
                    className="min-h-0 text-primary-text hover:text-ink"
                    aria-label={t("employer:jobEditor.removeSkill", { skill })}
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default JobEditorDetailsSection;
