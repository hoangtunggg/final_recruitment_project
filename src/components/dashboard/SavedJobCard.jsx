import { useTranslation } from "react-i18next";
import { FiTrash2 } from "react-icons/fi";
import { Badge } from "../ui";
import { useLocale } from "../../i18n/helpers";
import { splitSkills } from "../jobs/job-format-helpers";
import JobSummaryCard from "./JobSummaryCard";

/** A bookmarked job. `isAvailable` is false when the listing is no longer published. */
const SavedJobCard = ({ job, onRemove, isAvailable = true }) => {
  const { t } = useTranslation("candidate");
  const locale = useLocale();
  if (!job) return null;

  const skills = splitSkills(job.skills).slice(0, 3);
  const savedOn = job.savedAt
    ? t("saved.savedOn", { date: new Date(job.savedAt).toLocaleDateString(locale, { month: "short", day: "numeric" }) })
    : t("saved.saved");

  return (
    <JobSummaryCard
      job={job}
      linkable={isAvailable}
      closed={!isAvailable}
      footerText={savedOn}
      action={
        <button
          type="button"
          onClick={() => onRemove(job.id)}
          title={t("saved.remove")}
          aria-label={t("saved.removeAria", { title: job.title || "" })}
          className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-danger hover:text-danger"
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      }
      highlight={
        skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge key={skill} tone="primary" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        )
      }
    />
  );
};

export default SavedJobCard;
