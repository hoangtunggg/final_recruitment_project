import { useState } from "react";
import { useTranslation } from "react-i18next";
import { applicationService } from "../../services/applicationService";

/**
 * Two-step withdraw flow: `request(application)` opens the confirm dialog,
 * `confirm()` calls the API, refreshes the list and reports through `showFeedback`.
 */
const useWithdrawApplication = (refetchApplications, showFeedback) => {
  const { t } = useTranslation("candidate");
  const [application, setApplication] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const confirm = async () => {
    if (!application) return;
    try {
      setBusyId(application.id);
      const response = await applicationService.withdrawApplication(application.id);
      if (response.success) {
        await refetchApplications();
        showFeedback("success", t("feedback.withdrawn"));
      } else {
        showFeedback("error", t("feedback.withdrawFailed"));
      }
    } catch (error) {
      console.error("Withdraw failed:", error);
      showFeedback("error", t("feedback.withdrawFailed"));
    } finally {
      setBusyId(null);
      setApplication(null);
    }
  };

  return { application, busyId, request: setApplication, cancel: () => setApplication(null), confirm };
};

export default useWithdrawApplication;
