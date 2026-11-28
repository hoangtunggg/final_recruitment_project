import React from "react";
import { FiMail, FiPhone } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card, Input } from "../../ui";

/** Section 3: where candidate notifications and enquiries are routed. */
const JobEditorContactSection = ({ formData, errors, onChange, onBlur }) => {
  const { t } = useTranslation("employer");
  return (
    <Card className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="flex items-center space-x-2 text-lg font-extrabold text-ink">
          <FiMail className="text-primary-text" aria-hidden="true" />
          <span>{t("jobEditor.contact.title")}</span>
        </h2>
        <p className="mt-0.5 text-sm text-muted">{t("jobEditor.contact.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          label={t("jobEditor.fields.contactEmail")}
          type="email"
          name="contactEmail"
          leftIcon={<FiMail />}
          value={formData.contactEmail}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="recruiting@company.com"
          error={errors.contactEmail}
        />
        <Input
          label={t("jobEditor.fields.contactPhone")}
          type="tel"
          name="contactPhone"
          leftIcon={<FiPhone />}
          value={formData.contactPhone}
          onChange={onChange}
          placeholder="+84 912 345 678"
          maxLength={30}
        />
      </div>
    </Card>
  );
};

export default JobEditorContactSection;
