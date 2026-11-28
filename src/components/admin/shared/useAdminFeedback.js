import { useCallback, useState } from "react";

/**
 * Banner state shared by the admin list pages: `showFeedback("success" | "error", message)`
 * shows AdminNoticeBanner for 4 seconds (or until dismissed).
 */
export const useAdminFeedback = () => {
  const [notification, setNotification] = useState(null); // { type, message }

  const showFeedback = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const dismiss = useCallback(() => setNotification(null), []);

  return { notification, showFeedback, dismiss };
};
