import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { resumeService } from "../../services/resumeService";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const VALID_EXTENSIONS = ["pdf", "doc", "docx"];

/**
 * Resume list + upload / default / download / delete actions of the candidate dashboard.
 * Messages go through `showFeedback(type, message)`; delete is a two-step flow
 * (`requestDelete` opens the confirm dialog, `confirmDelete` calls the API).
 */
const useCandidateResumes = (showFeedback) => {
  const { t } = useTranslation("candidate");
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await resumeService.getMyResumes();
      if (response.success) setResumes(response.data || []);
      else setError(response.error || "load_failed");
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError(err.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
      showFeedback("error", t("resumes.feedback.tooLarge"));
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !VALID_EXTENSIONS.includes(extension)) {
      showFeedback("error", t("resumes.feedback.badFormat"));
      return;
    }
    try {
      setUploading(true);
      const response = await resumeService.uploadResume(file);
      if (response.success) {
        await refetch();
        showFeedback("success", t("resumes.feedback.uploaded", { name: file.name }));
      } else {
        showFeedback("error", t("resumes.feedback.uploadFailed"));
      }
    } catch (err) {
      console.error("Resume upload failed:", err);
      showFeedback("error", t("resumes.feedback.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const setDefault = async (id) => {
    try {
      setActionLoadingId(id);
      const response = await resumeService.setDefaultResume(id);
      if (response.success) {
        await refetch();
        showFeedback("success", t("resumes.feedback.defaultUpdated"));
      } else {
        showFeedback("error", t("resumes.feedback.defaultFailed"));
      }
    } catch (err) {
      console.error("Set default resume failed:", err);
      showFeedback("error", t("resumes.feedback.defaultFailed"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const download = async (id, name) => {
    try {
      await resumeService.downloadResume(id, name);
      showFeedback("success", t("resumes.feedback.downloaded", { name }));
    } catch (err) {
      console.error("Resume download failed:", err);
      showFeedback("error", t("resumes.feedback.downloadFailed"));
    }
  };

  const requestDelete = (id, name) => setToDelete({ id, name: name || t("resumes.thisResume") });
  const cancelDelete = () => setToDelete(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setActionLoadingId(toDelete.id);
      const response = await resumeService.deleteResume(toDelete.id);
      if (response.success) {
        await refetch();
        showFeedback("success", t("resumes.feedback.deleted", { name: toDelete.name }));
      } else {
        showFeedback("error", t("resumes.feedback.deleteFailed"));
      }
    } catch (err) {
      console.error("Resume delete failed:", err);
      showFeedback("error", t("resumes.feedback.deleteFailed"));
    } finally {
      setActionLoadingId(null);
      setToDelete(null);
    }
  };

  return { resumes, loading, error, uploading, actionLoadingId, toDelete, refetch, upload, setDefault, download, requestDelete, cancelDelete, confirmDelete };
};

export default useCandidateResumes;
