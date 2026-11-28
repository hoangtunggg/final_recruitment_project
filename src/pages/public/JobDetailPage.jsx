import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import JobMatchAnalysis from "../../components/candidate/JobMatchAnalysis";
import useJobDetail from "./job-detail/useJobDetail";
import useJobApplication from "./job-detail/useJobApplication";
import { JobDetailSkeleton, JobDetailNotFound } from "./job-detail/JobDetailStates";
import JobDetailHeader from "./job-detail/JobDetailHeader";
import JobDetailBody from "./job-detail/JobDetailBody";
import JobDetailSidebar from "./job-detail/JobDetailSidebar";
import JobApplicationModal from "./job-detail/JobApplicationModal";

/** Where the "back" link of a signed-in user goes (role portals keep their own lists). */
const backTarget = (role) => {
  if (role === "employer") return "/employer/jobs";
  if (role === "admin") return "/admin/jobs";
  return "/dashboard";
};

const JobDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation("public");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { job, loading, failed, companyProfile } = useJobDetail(id);
  const application = useJobApplication(id);
  const [copied, setCopied] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const goBack = () => navigate(backTarget(user?.role));
  const backLabel = isAuthenticated ? t("jobDetail.backToDashboard") : t("jobDetail.backToJobs");

  // Anonymous visitors are sent to login and come back to this job afterwards (behaviour unchanged).
  const handleApply = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/${id}`);
      return;
    }
    application.openModal();
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.warn("Could not copy link:", error);
    }
  };

  if (loading) return <JobDetailSkeleton />;
  if (!job || failed) {
    return (
      <JobDetailNotFound
        onBack={isAuthenticated ? goBack : () => navigate("/#browse-jobs")}
        backLabel={backLabel}
      />
    );
  }

  return (
    <div className="bg-canvas py-6 sm:py-10" data-testid="job-detail">
      <div className="mx-auto max-w-page px-4">
        <div className="mb-5">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary-text"
            >
              <FaArrowLeft aria-hidden="true" /> {backLabel}
            </button>
          ) : (
            <Link
              to="/#browse-jobs"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary-text"
            >
              <FaArrowLeft aria-hidden="true" /> {backLabel}
            </Link>
          )}
        </div>

        {import.meta.env.VITE_CVJD_MATCHING_ENABLED === "true" &&
          isAuthenticated &&
          user?.role === "jobseeker" && <JobMatchAnalysis jobId={id} />}

        <JobDetailHeader
          job={job}
          companyLogoUrl={companyProfile?.logoUrl}
          coverFailed={coverFailed}
          onCoverError={() => setCoverFailed(true)}
          onApply={handleApply}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <JobDetailBody job={job} />
          <JobDetailSidebar
            job={job}
            companyProfile={companyProfile}
            onApply={handleApply}
            onShare={handleShare}
            copied={copied}
          />
        </div>
      </div>

      {application.open && <JobApplicationModal job={job} user={user} app={application} />}
    </div>
  );
};

export default JobDetailPage;
