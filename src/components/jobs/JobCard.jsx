import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaArrowRight } from "react-icons/fa";
import CompanyLogo from "../common/CompanyLogo";
import { Badge, cx } from "../ui";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { useEnumLabel } from "../../i18n/helpers";
import { jobTypeTone, splitSkills, useTimeAgo } from "./job-format-helpers";

/**
 * Job card used in the home listing grid.
 * The whole card is one link to /jobs/:id (no nested buttons, so it is valid HTML and keyboard friendly).
 * `job.companyLogoUrl` is optional and injected by the listing page.
 */
const JobCard = ({ job }) => {
  const { t } = useTranslation("public");
  const enumLabel = useEnumLabel();
  const timeAgo = useTimeAgo();
  const imageUrl = resolveMediaUrl(job?.imageUrl);
  const [failedImageUrl, setFailedImageUrl] = useState(null);

  if (!job) return null;

  const skills = splitSkills(job.skills).slice(0, 3);
  const showCover = imageUrl && failedImageUrl !== imageUrl;

  return (
    <Link
      to={`/jobs/${job.id}`}
      data-testid="job-card"
      className={cx(
        "group flex min-w-0 flex-col overflow-hidden rounded-card border border-tint-line bg-surface",
        "shadow-card transition-shadow duration-200 hover:shadow-card-hover motion-reduce:transition-none"
      )}
    >
      {showCover && (
        <div className="aspect-[16/6] overflow-hidden bg-tint">
          <img
            src={imageUrl}
            alt={t("jobCard.coverAlt", { title: job.title, company: job.company })}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <CompanyLogo name={job.company} src={job.companyLogoUrl} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{job.company}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <FaMapMarkerAlt className="shrink-0 text-xs" aria-hidden="true" />
              <span className="truncate">{job.location || t("jobCard.remoteFallback")}</span>
            </p>
          </div>
          {job.type && (
            <Badge tone={jobTypeTone(job.type)} size="sm">
              {enumLabel("jobType", job.type)}
            </Badge>
          )}
        </div>

        <h3 className="mt-4 line-clamp-2 min-h-[3.25rem] text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary-text">
          {job.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {job.salary && (
            <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-success">
              <FaMoneyBillWave className="shrink-0 text-xs" aria-hidden="true" />
              <span className="truncate">{job.salary}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-muted">
            <FaClock className="shrink-0 text-xs" aria-hidden="true" />
            {timeAgo(job.createdAt || job.posted)}
          </span>
        </div>

        {(job.experience || skills.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.experience && (
              <Badge tone="neutral" size="sm">
                {enumLabel("experienceLevel", job.experience)}
              </Badge>
            )}
            {skills.map((skill) => (
              <Badge key={skill} tone="primary" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-brand-green" aria-hidden="true" />
            {t("jobCard.hiring")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-text">
            {t("jobCard.viewJob")}
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
