import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaMapMarkerAlt } from "react-icons/fa";
import CompanyLogo from "../common/CompanyLogo";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const CompanyCard = ({ company, fallbackJobId, roleCount = 0 }) => {
  const coverUrl = resolveMediaUrl(company?.coverUrl);
  const [failedCoverUrl, setFailedCoverUrl] = useState(null);

  if (!company && !fallbackJobId) return null;

  return (
    <Link
      to={fallbackJobId ? `/jobs/${fallbackJobId}` : "/#browse-jobs"}
      className="group min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white transition-colors hover:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-100 dark:from-blue-950 dark:via-indigo-950/70 dark:to-gray-800">
        {coverUrl && failedCoverUrl !== coverUrl && (
          <img
            src={coverUrl}
            alt={`${company.name} workplace`}
            className="h-full w-full object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onError={() => setFailedCoverUrl(coverUrl)}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/35 to-transparent" aria-hidden="true" />
      </div>

      <div className="relative px-4 pb-4">
        <CompanyLogo
          name={company.name}
          src={company.logoUrl}
          className="-mt-6 h-12 w-12"
        />
        <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
          {company.name}
        </h3>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300">
          <FaMapMarkerAlt className="shrink-0 text-xs text-slate-400" aria-hidden="true" />
          <span className="truncate">{company.location || "Multiple locations"}</span>
        </p>
        <div className="mt-4 flex min-h-11 items-center justify-between gap-2 border-t border-slate-200 pt-3 text-sm font-semibold text-blue-700 dark:border-gray-700 dark:text-blue-300">
          <span>{roleCount} open role{roleCount === 1 ? "" : "s"}</span>
          <FaArrowRight className="shrink-0 text-xs" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
};

export default CompanyCard;
