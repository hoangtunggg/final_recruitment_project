import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowRight, FaMapMarkerAlt } from "react-icons/fa";
import CompanyLogo from "../common/CompanyLogo";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/** Hiring-company card: cover, logo, name, location and the number of open roles. */
const CompanyCard = ({ company, fallbackJobId, roleCount = 0 }) => {
  const { t } = useTranslation("public");
  const coverUrl = resolveMediaUrl(company?.coverUrl);
  const [failedCoverUrl, setFailedCoverUrl] = useState(null);

  if (!company && !fallbackJobId) return null;

  return (
    <Link
      to={fallbackJobId ? `/jobs/${fallbackJobId}` : "/#browse-jobs"}
      className="group min-w-0 overflow-hidden rounded-card border border-tint-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover motion-reduce:transition-none"
    >
      <div className="relative aspect-[16/6] overflow-hidden bg-tint">
        {coverUrl && failedCoverUrl !== coverUrl && (
          <img
            src={coverUrl}
            alt={t("companyCard.coverAlt", { name: company.name })}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setFailedCoverUrl(coverUrl)}
          />
        )}
      </div>

      <div className="px-5 pb-5">
        <CompanyLogo name={company.name} src={company.logoUrl} className="relative -mt-7 h-14 w-14 shadow-card" />
        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary-text">
          {company.name}
        </h3>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted">
          <FaMapMarkerAlt className="shrink-0 text-xs" aria-hidden="true" />
          <span className="truncate">{company.location || t("companyCard.multiLocation")}</span>
        </p>
        <div className="mt-4 flex min-h-11 items-center justify-between gap-2 border-t border-line pt-3 text-sm font-semibold text-primary-text">
          <span>{t("companyCard.openRoles", { n: roleCount })}</span>
          <FaArrowRight className="shrink-0 text-xs" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
};

export default CompanyCard;
