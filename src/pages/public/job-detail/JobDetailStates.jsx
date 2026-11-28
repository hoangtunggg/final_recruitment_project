import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { Button, EmptyState } from "../../../components/ui";

/** Loading placeholder shaped like the real page (header card + two columns). */
export const JobDetailSkeleton = () => {
  const { t } = useTranslation("common");
  return (
    <div className="bg-canvas py-8" role="status" aria-label={t("states.loading")}>
      <div className="mx-auto max-w-page animate-pulse px-4 sm:px-6 lg:px-8">
        <div className="mb-6 h-5 w-32 rounded bg-tint" />
        <div className="rounded-card border border-tint-line bg-surface p-6 shadow-card sm:p-8">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-card bg-tint" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-1/2 rounded bg-tint" />
              <div className="h-5 w-1/4 rounded bg-tint" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-tint" />
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-64 rounded-card bg-tint" />
          <div className="h-40 rounded-card bg-tint" />
        </div>
      </div>
    </div>
  );
};

/** Shown when the job does not exist, was removed, or the request failed. */
export const JobDetailNotFound = ({ onBack, backLabel }) => {
  const { t } = useTranslation("public");
  return (
    <div className="flex min-h-[60vh] items-center bg-canvas py-16">
      <div className="mx-auto w-full max-w-lg px-4">
        <EmptyState
          icon={<FaSearch />}
          title={t("jobDetail.notFound.title")}
          description={t("jobDetail.notFound.description")}
          action={
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="primary" onClick={onBack}>
                {backLabel}
              </Button>
              <Button as={Link} to="/#browse-jobs" variant="outline">
                {t("jobDetail.notFound.browse")}
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};
