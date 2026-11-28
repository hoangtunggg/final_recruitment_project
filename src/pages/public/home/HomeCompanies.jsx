import { useTranslation } from "react-i18next";
import { FaArrowRight } from "react-icons/fa";
import CompanyCard from "../../../components/companies/CompanyCard";
import { PageHeader } from "../../../components/ui";

/** Organisations present in the current listings (hidden when there are none). */
const HomeCompanies = ({ organizations, onBrowse }) => {
  const { t } = useTranslation("public");
  if (organizations.length === 0) return null;

  return (
    <section className="bg-canvas py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4">
        <PageHeader
          level={2}
          eyebrow={t("home.companies.eyebrow")}
          title={t("home.companies.title")}
          subtitle={t("home.companies.subtitle")}
          className="mb-8"
          actions={
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-primary-text"
            >
              {t("home.companies.browseAll")} <FaArrowRight aria-hidden="true" />
            </button>
          }
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => (
            <CompanyCard
              key={organization.name}
              company={organization}
              fallbackJobId={organization.jobId}
              roleCount={organization.rolesInCurrentListings}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCompanies;
