import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaMoneyBillWave,
  FaGraduationCap,
  FaCalendarAlt,
  FaPaperPlane,
  FaMicrophoneAlt,
} from "react-icons/fa";
import CompanyLogo from "../../../components/common/CompanyLogo";
import { Badge, Button } from "../../../components/ui";
import { jobTypeTone, useTimeAgo } from "../../../components/jobs/job-format-helpers";
import { useEnumLabel, useLocale } from "../../../i18n/helpers";
import { resolveMediaUrl } from "../../../utils/mediaUrl";

const Fact = ({ icon, label, value }) => (
  <div className="flex min-w-0 items-start gap-3">
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint text-primary-text"
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="break-words font-semibold text-ink">{value}</p>
    </div>
  </div>
);

/**
 * Hero card of the job detail page: identity, key facts and the two primary actions
 * (apply + practise an AI interview for this exact job).
 */
const JobDetailHeader = ({ job, companyLogoUrl, coverFailed, onCoverError, onApply }) => {
  const { t } = useTranslation("public");
  const enumLabel = useEnumLabel();
  const locale = useLocale();
  const timeAgo = useTimeAgo();
  const coverUrl = resolveMediaUrl(job.imageUrl);
  const date = (value) => {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
      : null;
  };
  const posted = date(job.createdAt || job.posted);
  const deadline = date(job.applicationDeadline);

  return (
    <section
      aria-labelledby="job-title"
      className="overflow-hidden rounded-card border border-tint-line bg-surface shadow-card"
    >
      {coverUrl && !coverFailed && (
        <div className="aspect-[16/5] bg-tint">
          <img
            src={coverUrl}
            alt={t("jobCard.coverAlt", { title: job.title, company: job.company })}
            className="h-full w-full object-cover"
            onError={onCoverError}
          />
        </div>
      )}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <CompanyLogo name={job.company} src={companyLogoUrl} className="h-16 w-16 sm:h-20 sm:w-20" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {job.type && <Badge tone={jobTypeTone(job.type)}>{enumLabel("jobType", job.type)}</Badge>}
              {job.experience && <Badge tone="neutral">{enumLabel("experienceLevel", job.experience)}</Badge>}
            </div>
            <h1 id="job-title" className="mt-2 break-words text-2xl font-extrabold leading-tight text-ink sm:text-4xl">
              {job.title}
            </h1>
            <p className="mt-1 text-lg font-semibold text-primary-text">{job.company}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={<FaMapMarkerAlt />} label={t("jobDetail.facts.location")} value={job.location || t("jobCard.remoteFallback")} />
          <Fact icon={<FaMoneyBillWave />} label={t("jobDetail.facts.salary")} value={job.salary || t("jobDetail.facts.negotiable")} />
          <Fact icon={<FaBriefcase />} label={t("jobDetail.facts.experience")} value={job.experience ? enumLabel("experienceLevel", job.experience) : t("jobDetail.facts.notSpecified")} />
          <Fact icon={<FaClock />} label={t("jobDetail.facts.posted")} value={posted ? `${posted} · ${timeAgo(job.createdAt || job.posted)}` : timeAgo(null)} />
          {deadline && <Fact icon={<FaCalendarAlt />} label={t("jobDetail.facts.deadline")} value={deadline} />}
          {job.education && <Fact icon={<FaGraduationCap />} label={t("jobDetail.facts.education")} value={job.education} />}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button size="lg" leftIcon={<FaPaperPlane />} onClick={onApply} data-testid="job-apply-button">
            {t("jobDetail.applyNow")}
          </Button>
          <Button
            as={Link}
            to={`/interview?jobId=${encodeURIComponent(job.id)}`}
            size="lg"
            variant="outline"
            leftIcon={<FaMicrophoneAlt />}
            data-testid="job-ai-interview-cta"
          >
            {t("jobDetail.practiceInterview")}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">{t("jobDetail.practiceHint")}</p>
      </div>
    </section>
  );
};

export default JobDetailHeader;
