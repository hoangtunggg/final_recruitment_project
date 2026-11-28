import React from "react";
import { useTranslation } from "react-i18next";
import { FiBookmark, FiCheck } from "react-icons/fi";
import { Badge, cx } from "../ui";
import { splitSkills } from "../jobs/job-format-helpers";
import JobSummaryCard from "./JobSummaryCard";

/** A recommended job with a save toggle and the profile skills it matches. */
const RecommendedJobCard = ({ job, isSaved = false, onToggleSave, matchedSkills = [] }) => {
  const { t } = useTranslation("candidate");
  if (!job) return null;

  const hasMatches = matchedSkills.length > 0;
  const skills = hasMatches ? matchedSkills : splitSkills(job.skills).slice(0, 3);

  return (
    <JobSummaryCard
      job={job}
      footerText={hasMatches ? t("recommended.matching", { n: matchedSkills.length }) : t("recommended.active")}
      action={
        <button
          type="button"
          onClick={() => onToggleSave(job)}
          title={isSaved ? t("recommended.saved") : t("recommended.save")}
          aria-label={isSaved ? t("recommended.unsaveAria", { title: job.title || "" }) : t("recommended.saveAria", { title: job.title || "" })}
          aria-pressed={isSaved}
          className={cx(
            "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors",
            isSaved ? "border-primary-500 bg-tint text-primary-text" : "border-line text-muted hover:border-primary-500 hover:text-primary-text"
          )}
        >
          <FiBookmark className={isSaved ? "fill-current" : ""} aria-hidden="true" />
        </button>
      }
      highlight={
        skills.length > 0 && (
          <div>
            {hasMatches && (
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-primary-text">
                <FiCheck aria-hidden="true" /> {t("recommended.matchesProfile")}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Badge key={skill} tone={hasMatches ? "success" : "primary"} size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )
      }
    />
  );
};

export default RecommendedJobCard;
