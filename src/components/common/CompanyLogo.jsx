import { useState } from "react";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const getInitials = (name = "Company") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const CompanyLogo = ({ name, src, className = "h-12 w-12", imageClassName = "p-1.5" }) => {
  const resolvedSrc = resolveMediaUrl(src);
  const [failedSrc, setFailedSrc] = useState(null);

  return (
    <div
      className={`${className} overflow-hidden rounded-xl border border-slate-200 bg-white text-blue-800 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-blue-200 flex shrink-0 items-center justify-center font-bold`}
    >
      {resolvedSrc && failedSrc !== resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={`${name || "Company"} logo`}
          className={`h-full w-full object-contain ${imageClassName}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(resolvedSrc)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  );
};

export default CompanyLogo;
