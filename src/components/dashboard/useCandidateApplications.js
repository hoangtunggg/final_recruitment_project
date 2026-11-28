import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { applicationService } from "../../services/applicationService";

/**
 * Candidate's own applications: loading / error state, refetch and live status updates
 * (window event `applicationStatusUpdated` + cross-tab `storage` event, as before).
 * `showFeedback(type, message, duration)` is the dashboard banner.
 */
const useCandidateApplications = (user, showFeedback) => {
  const { t } = useTranslation("candidate");
  const email = user?.email;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!email) return;
    try {
      setLoading(true);
      setError(null);
      const response = await applicationService.getApplicationsByEmail(email);
      if (response.success) setApplications(response.data || []);
      else setError(response.error || "load_failed");
    } catch (err) {
      console.error("Error fetching user applications:", err);
      setError(err.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleStatusUpdate = (event) => {
      const detail = event.detail;
      if (!detail || detail.applicantEmail !== email) return;

      setApplications((previous) =>
        previous.map((app) => (app.id === detail.applicationId ? { ...app, status: detail.newStatus } : app))
      );

      const message = t(`statusMessages.${detail.newStatus}`, {
        defaultValue: t("statusMessages.generic", { status: detail.newStatus }),
      });

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(t("statusMessages.title"), { body: message, icon: "/favicon.ico" });
      }
      showFeedback("info", t("feedback.applicationUpdate", { message }), 6000);
    };

    const handleStorageChange = (event) => {
      if (event.key !== "applicationStatusUpdate") return;
      try {
        const statusUpdate = JSON.parse(event.newValue);
        if (statusUpdate && statusUpdate.applicantEmail === email) {
          handleStatusUpdate({ detail: statusUpdate });
        }
      } catch (err) {
        console.error("Error parsing storage update:", err);
      }
    };

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    window.addEventListener("applicationStatusUpdated", handleStatusUpdate);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("applicationStatusUpdated", handleStatusUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [email, showFeedback, t]);

  return { applications, loading, error, refetch };
};

export default useCandidateApplications;
