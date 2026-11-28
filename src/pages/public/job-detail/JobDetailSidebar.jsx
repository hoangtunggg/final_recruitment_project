import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt, FaPaperPlane, FaMicrophoneAlt, FaCheck, FaShareAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import CompanyLogo from "../../../components/common/CompanyLogo";
import { Button, Card } from "../../../components/ui";

/**
 * Right column: company card + a tinted AI-interview card (second, softer entry point
 * to the same /interview?jobId= flow) + share. The primary actions live in the header.
 */
const JobDetailSidebar = ({ job, companyProfile, onApply, onShare, copied }) => {
  const { t } = useTranslation("public");

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label={t("jobDetail.sidebarLabel")}>
      <Card as="section" tone="tint" padding="md">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white" aria-hidden="true">
          <FaMicrophoneAlt />
        </span>
        <h2 className="mt-3 text-lg font-bold text-ink">{t("jobDetail.aiCard.title")}</h2>
        <p className="mt-1 text-muted">{t("jobDetail.aiCard.description")}</p>
        <Button
          as={Link}
          to={`/interview?jobId=${encodeURIComponent(job.id)}`}
          variant="outline"
          size="sm"
          className="mt-4"
          data-testid="job-ai-interview-card-link"
        >
          {t("jobDetail.aiCard.cta")}
        </Button>
      </Card>

      <Card as="section" padding="md">
        <div className="flex items-center gap-3">
          <CompanyLogo name={job.company} src={companyProfile?.logoUrl} className="h-12 w-12" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">{job.company}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <FaMapMarkerAlt className="shrink-0 text-xs" aria-hidden="true" />
              <span className="truncate">{companyProfile?.location || job.location || t("companyCard.multiLocation")}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <Button fullWidth leftIcon={<FaPaperPlane />} onClick={onApply}>
            {t("jobDetail.applyNow")}
          </Button>
          <Button fullWidth variant="ghost" leftIcon={copied ? <FaCheck /> : <FaShareAlt />} onClick={onShare}>
            {copied ? t("jobDetail.linkCopied") : t("jobDetail.share")}
          </Button>
        </div>
      </Card>
    </aside>
  );
};

export default JobDetailSidebar;
