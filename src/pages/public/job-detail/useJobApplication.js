import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { applicationService } from "../../../services/applicationService";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const EMPTY_FORM = {
  phone: "",
  experience: "",
  education: "",
  skills: "",
  coverLetter: "",
  resume: null,
};
const REQUIRED_FIELDS = ["phone", "experience", "education", "skills", "coverLetter"];

/**
 * State + validation + submit for the "apply" modal. The payload sent to the API is unchanged;
 * only messages are translated (`public:apply.errors.*`).
 */
const useJobApplication = (jobId) => {
  const { t } = useTranslation("public");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const openModal = useCallback(() => {
    setSuccess(false);
    setOpen(true);
  }, []);
  const closeModal = useCallback(() => setOpen(false), []);

  // Escape closes the dialog (keyboard users), unless a request is in flight.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, submitting]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_RESUME_BYTES) {
      setErrors((prev) => ({ ...prev, resume: t("apply.errors.fileTooLarge") }));
      event.target.value = "";
      return;
    }
    setErrors((prev) => ({ ...prev, resume: "" }));
    setData((prev) => ({ ...prev, resume: file }));
  };

  const validate = () => {
    const next = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!data[field].trim()) next[field] = t(`apply.errors.${field}`);
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await applicationService.submitApplication({
        jobId,
        applicantPhone: data.phone,
        experience: data.experience,
        education: data.education,
        skills: data.skills,
        coverLetter: data.coverLetter,
        availability: "Immediate",
        resume: data.resume,
      });

      if (!(response.success || response.id || response.data)) {
        throw new Error(response.error || "Failed to submit application");
      }

      setSuccess(true);
      setData(EMPTY_FORM);

      // Global + storage events keep an open dashboard tab in sync (behaviour unchanged).
      const eventData = { jobId, timestamp: Date.now() };
      window.dispatchEvent(new CustomEvent("applicationSubmitted", { detail: eventData }));
      localStorage.setItem("applicationSubmitted", JSON.stringify(eventData));
      localStorage.setItem("applicationSubmittedTimestamp", Date.now().toString());

      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2200);
    } catch (err) {
      console.error("Error submitting application:", err);
      setErrors((prev) => ({
        ...prev,
        form: err.response?.data?.error || t("apply.errors.submitFailed"),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return { open, openModal, closeModal, data, errors, submitting, success, handleChange, handleFile, submit };
};

export default useJobApplication;
