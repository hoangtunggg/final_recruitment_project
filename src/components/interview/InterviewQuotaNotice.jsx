import { FiClock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui";

/** Today's interview quota ({limit, used, remaining}); nothing is rendered until it is loaded. */
const InterviewQuotaNotice = ({ quota }) => {
  const { t } = useTranslation("interview");
  if (!quota) return null;
  const exhausted = quota.remaining <= 0;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" data-testid="interview-quota">
      <Badge tone={exhausted ? "danger" : "primary"} icon={<FiClock />} className="!whitespace-normal text-left">
        {t("setup.quotaRemaining", { remaining: quota.remaining, limit: quota.limit })}
      </Badge>
      {exhausted && <span className="text-sm text-danger">{t("errors.quotaExceeded")}</span>}
    </div>
  );
};

export default InterviewQuotaNotice;
