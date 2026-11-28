import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiBriefcase, FiFileText, FiCheck } from "react-icons/fi";
import { useJobs } from "../../context/JobContext";
import { Button, Card, Input, Select, Textarea } from "../../components/ui";
import { useEnumLabel } from "../../i18n/helpers";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import { EXPERIENCE_LEVELS, JOB_TYPES } from "../../components/admin/jobs/job-form-options";

// Fields that must be filled before a job can be created or published.
const REQUIRED_FIELDS = ["title", "company", "location", "description", "requirements", "responsibilities"];

// Fields rendered without placeholder text (selects and the date picker).
const NO_PLACEHOLDER = ["type", "experience", "applicationDeadline"];

const SectionTitle = ({ icon, children }) => (
  <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
    {icon}
    {children}
  </h2>
);

const AddJob = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  const { addJob } = useJobs();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    responsibilities: "",
    salary: "",
    experience: "Entry Level",
    education: "",
    skills: "",
    benefits: "",
    applicationDeadline: "",
    contactEmail: "",
    contactPhone: "",
    status: "Published",
  });

  // errors[field] === true marks a missing required field; the message is translated at render time.
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!formData[field].trim()) newErrors[field] = true;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const result = await addJob({
        ...formData,
        approvalStatus: "approved",
      });
      if (result.success) {
        alert(t("addJob.alerts.created"));
        navigate("/admin/jobs");
      } else {
        alert(t("addJob.alerts.postError", { error: result.error }));
      }
    }
  };

  const handleSaveDraft = async () => {
    const result = await addJob({ ...formData, status: "Draft" });
    if (result.success) {
      alert(t("addJob.alerts.draftSaved"));
    } else {
      alert(t("addJob.alerts.draftError", { error: result.error }));
    }
  };

  const handlePublish = async () => {
    if (validateForm()) {
      const result = await addJob({
        ...formData,
        status: "Published",
        approvalStatus: "approved",
      });
      if (result.success) {
        alert(t("addJob.alerts.published"));
        navigate("/admin/jobs");
      } else {
        alert(t("addJob.alerts.publishError", { error: result.error }));
      }
    }
  };

  // Shared props for a text control bound to formData[name] (label gets " *" when required, no native `required`
  // because validation is custom and shows inline messages).
  const field = (name) => ({
    name,
    value: formData[name],
    onChange: handleInputChange,
    label: t(`addJob.fields.${name}`) + (REQUIRED_FIELDS.includes(name) ? " *" : ""),
    placeholder: NO_PLACEHOLDER.includes(name) ? undefined : t(`addJob.placeholders.${name}`),
    error: errors[name] ? t(`addJob.errors.${name}`) : undefined,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("addJob.title")}
        subtitle={t("addJob.subtitle")}
        leading={
          <Button
            variant="link"
            onClick={() => navigate("/admin/jobs")}
            leftIcon={<FiArrowLeft className="w-5 h-5" />}
            className="mb-2"
          >
            {t("addJob.back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <SectionTitle icon={<FiBriefcase aria-hidden="true" />}>{t("addJob.sections.basic")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input {...field("title")} />
            <Input {...field("company")} />
            <Input {...field("location")} />
            <Select {...field("type")}>
              {JOB_TYPES.map((value) => (
                <option key={value} value={value}>
                  {label("jobType", value)}
                </option>
              ))}
            </Select>
            <Input {...field("salary")} />
            <Select {...field("experience")}>
              {EXPERIENCE_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {label("experienceLevel", value)}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<FiFileText aria-hidden="true" />}>{t("addJob.sections.details")}</SectionTitle>
          <div className="space-y-6">
            <Textarea rows={4} {...field("description")} />
            <Textarea rows={4} {...field("responsibilities")} />
            <Textarea rows={4} {...field("requirements")} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input {...field("education")} />
              <Input {...field("skills")} />
            </div>
            <Textarea rows={3} {...field("benefits")} />
          </div>
        </Card>

        <Card>
          <SectionTitle>{t("addJob.sections.application")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input type="date" {...field("applicationDeadline")} />
            <Input type="email" {...field("contactEmail")} />
            <Input type="tel" {...field("contactPhone")} />
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            {t("addJob.saveDraft")}
          </Button>
          <Button type="submit" variant="outline">
            {t("addJob.create")}
          </Button>
          <Button onClick={handlePublish} leftIcon={<FiCheck className="w-4 h-4" />}>
            {t("addJob.publish")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddJob;
