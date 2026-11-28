import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const getInitials = (name = "Company") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * Square company logo with an initials fallback.
 * Props (unchanged, also used by the employer profile editor): name, src, className, imageClassName.
 */
const CompanyLogo = ({ name, src, className = "h-12 w-12", imageClassName = "p-1.5" }) => {
  const { t } = useTranslation("public");
  const resolvedSrc = resolveMediaUrl(src);
  const [failedSrc, setFailedSrc] = useState(null);

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-card border border-tint-line bg-surface font-bold text-primary-text`}
    >
      {resolvedSrc && failedSrc !== resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={t("company.logoAlt", { name: name || t("company.fallbackName") })}
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
