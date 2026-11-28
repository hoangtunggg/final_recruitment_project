import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave, FiAlertCircle, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { jobService } from "../../services/jobService";
import useAuth from "../../hooks/useAuth";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { companyService } from "../../services/companyService";
import { Button } from "../ui";
import { serverErrorText } from "../../pages/employer/employer-api-helpers";
import JobEditorCoreSection from "./job-editor/JobEditorCoreSection";
import JobEditorImageSection from "./job-editor/JobEditorImageSection";
import JobEditorDetailsSection, { MAX_SKILLS } from "./job-editor/JobEditorDetailsSection";
import JobEditorContactSection from "./job-editor/JobEditorContactSection";

const EMPTY_FORM = {
  title: "",
  company: "",
  location: "",
  type: "Full-time",
  experience: "Mid Level",
  salary: "",
  description: "",
  requirements: "",
  responsibilities: "",
  benefits: "",
  applicationDeadline: "",
  contactEmail: "",
  contactPhone: "",
  status: "active",
};

/**
 * Validation rules. Returns a translation descriptor `{ key, params }` (employer:jobEditor.validation.*)
 * so error text follows the active language even after it is stored in state.
 */
const validateField = (name, value) => {
  const text = value.trim();
  const fail = (key, params) => ({ key: `jobEditor.validation.${key}`, params });
  switch (name) {
    case "title":
      if (!text) return fail("titleRequired");
      if (text.length < 3) return fail("titleMin");
      if (text.length > 100) return fail("titleMax");
      return null;
    case "company":
      if (!text) return fail("companyRequired");
      if (text.length < 2) return fail("companyMin");
      if (text.length > 100) return fail("companyMax");
      return null;
    case "location":
      if (!text) return fail("locationRequired");
      if (text.length < 2) return fail("locationMin");
      return null;
    case "description":
      if (!text) return fail("descriptionRequired");
      if (text.length < 30) return fail("descriptionMin", { current: text.length });
      if (text.length > 5000) return fail("descriptionMax");
      return null;
    case "requirements":
      if (!text) return fail("requirementsRequired");
      if (text.length < 20) return fail("requirementsMin", { current: text.length });
      if (text.length > 3000) return fail("requirementsMax");
      return null;
    case "contactEmail":
      if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return fail("emailInvalid");
      return null;
    default:
      return null;
  }
};

const VALIDATED_FIELDS = ["title", "company", "location", "description", "requirements", "contactEmail"];

const JobEditorForm = ({ initialData = null, isEdit = false, jobId = null }) => {
  const { t } = useTranslation(["employer", "common"]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [skillsList, setSkillsList] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [errors, setErrors] = useState({}); // field -> { key, params } | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null); // { key } | { raw }
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    let active = true;
    companyService
      .getMine()
      .then((response) => {
        if (!active || !response.data) return;
        setCompanyProfile(response.data);
        if (!initialData) {
          setFormData((current) => ({ ...current, company: response.data.name }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialData]);

  useEffect(
    () => () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview]
  );

  // Populate form if initialData exists, otherwise pre-fill from the user profile
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        company: initialData.company || user?.company || "",
        location: initialData.location || "",
        type: initialData.type || "Full-time",
        experience: initialData.experience || "Mid Level",
        salary: initialData.salary || "",
        description: initialData.description || "",
        requirements: initialData.requirements || "",
        responsibilities: initialData.responsibilities || "",
        benefits: initialData.benefits || "",
        applicationDeadline: initialData.applicationDeadline
          ? initialData.applicationDeadline.split("T")[0]
          : "",
        contactEmail: initialData.contactEmail || user?.email || "",
        contactPhone: initialData.contactPhone || "",
        status: initialData.status || "active",
      });
      if (Array.isArray(initialData.skills)) {
        setSkillsList(initialData.skills);
      } else if (typeof initialData.skills === "string") {
        setSkillsList(initialData.skills.split(",").map((s) => s.trim()).filter(Boolean));
      }
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        company: user.company || user.name || "",
        contactEmail: user.email || "",
      }));
    }
  }, [initialData, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Real-time error clearance
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = currentSkill.trim();
    if (!trimmed) return;
    if (skillsList.length >= MAX_SKILLS) {
      setErrors((prev) => ({
        ...prev,
        skills: { key: "jobEditor.validation.skillsMax", params: { max: MAX_SKILLS } },
      }));
      return;
    }
    if (skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCurrentSkill("");
      return;
    }
    setSkillsList([...skillsList, trimmed]);
    setCurrentSkill("");
    setErrors((prev) => ({ ...prev, skills: null }));
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageError = (key) => setErrors((prev) => ({ ...prev, image: { key: `jobEditor.validation.${key}` } }));
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      imageError("imageType");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      imageError("imageSize");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (overrideStatus) => {
    const currentStatus = overrideStatus || formData.status;

    // Full form validation
    const newErrors = {};
    VALIDATED_FIELDS.forEach((name) => {
      const err = validateField(name, formData[name]);
      if (err) newErrors[name] = err;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError({ key: "jobEditor.banner.fixFields" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      companyId: companyProfile?.id || initialData?.companyId || null,
      location: formData.location.trim(),
      type: formData.type,
      experience: formData.experience,
      salary: formData.salary.trim() || null,
      description: formData.description.trim(),
      requirements: formData.requirements.trim(),
      responsibilities: formData.responsibilities.trim() || null,
      benefits: formData.benefits.trim() || null,
      applicationDeadline: formData.applicationDeadline || null,
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      skills: skillsList.join(", "),
      status: currentStatus,
    };

    try {
      const response =
        isEdit && jobId
          ? await jobService.updateJob(jobId, payload)
          : await jobService.createJob(payload);

      if (response && response.success) {
        const savedJob = response.data || response;
        if (imageFile && savedJob.id) {
          await jobService.uploadJobImage(savedJob.id, imageFile);
        }
        setSubmitSuccess(true);
        setTimeout(() => navigate("/employer/jobs"), 1200);
      } else {
        throw new Error(response?.error || "save_failed");
      }
    } catch (err) {
      console.error("Job save error:", err);
      const serverMessage = err.message === "save_failed" ? null : serverErrorText(err);
      setSubmitError(
        serverMessage
          ? { raw: serverMessage }
          : { key: "jobEditor.banner.saveFailed" }
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Translate stored descriptors at render time so a language switch updates them too.
  const tx = (descriptor) => (descriptor ? t(`employer:${descriptor.key}`, descriptor.params) : null);
  const translatedErrors = Object.fromEntries(
    Object.entries(errors).map(([name, descriptor]) => [name, tx(descriptor)])
  );
  const submitErrorText = submitError ? submitError.raw || tx(submitError) : null;
  const previewSrc = imagePreview || resolveMediaUrl(initialData?.imageUrl);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {submitSuccess && (
        <div
          role="status"
          data-testid="job-form-success"
          className="flex items-center space-x-3 rounded-card border border-success/30 bg-success/10 p-4 text-success"
        >
          <FiCheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold">
            {isEdit ? t("employer:jobEditor.banner.updated") : t("employer:jobEditor.banner.created")}
          </p>
        </div>
      )}

      {submitErrorText && (
        <div
          role="alert"
          className="flex items-center space-x-3 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger"
        >
          <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">{submitErrorText}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
        className="space-y-6"
      >
        <JobEditorCoreSection
          formData={formData}
          errors={translatedErrors}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
        />
        <JobEditorImageSection
          imageFile={imageFile}
          hasExistingImage={Boolean(initialData?.imageUrl)}
          previewSrc={previewSrc}
          error={translatedErrors.image}
          onChange={handleImageChange}
        />
        <JobEditorDetailsSection
          formData={formData}
          errors={translatedErrors}
          onChange={handleInputChange}
          onBlur={handleBlur}
          skillsList={skillsList}
          currentSkill={currentSkill}
          onCurrentSkillChange={setCurrentSkill}
          onAddSkill={handleAddSkill}
          onRemoveSkill={(skill) => setSkillsList(skillsList.filter((s) => s !== skill))}
          onSkillKeyDown={handleKeyDownSkill}
        />
        <JobEditorContactSection
          formData={formData}
          errors={translatedErrors}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />

        <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
          <Button
            variant="ghost"
            onClick={() => navigate("/employer/jobs")}
            leftIcon={<FiArrowLeft />}
            className="w-full sm:w-auto"
          >
            {t("common:actions.cancel")}
          </Button>
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit("Draft")}
              leftIcon={<FiSave />}
              className="w-full sm:w-auto"
            >
              {t("employer:jobEditor.saveDraft")}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              data-testid="job-form-submit"
              leftIcon={isSubmitting ? undefined : <FiCheckCircle />}
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? isEdit
                  ? t("employer:jobEditor.updating")
                  : t("employer:jobEditor.publishing")
                : isEdit
                ? t("employer:jobEditor.update")
                : t("employer:jobEditor.publish")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobEditorForm;
