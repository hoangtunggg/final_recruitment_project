import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBolt, FaShieldAlt } from "react-icons/fa";
import { Brand } from "../ui";
import { useHideChrome } from "./chrome-visibility";

// Footer link columns. Labels are keys in common:footer.* (routes are unchanged).
const COLUMNS = [
  {
    titleKey: "footer.forJobSeekers",
    links: [
      { to: "/#browse-jobs", labelKey: "footer.browseAll" },
      { to: "/#categories", labelKey: "footer.exploreCategories" },
      { to: "/?type=Remote#browse-jobs", labelKey: "footer.remote" },
      { to: "/?type=Full-time#browse-jobs", labelKey: "footer.fullTime" },
      { to: "/dashboard", labelKey: "footer.candidateDashboard" },
      { to: "/interview", labelKey: "footer.aiInterview" },
    ],
  },
  {
    titleKey: "footer.forEmployers",
    links: [
      { to: "/employer/post-job", labelKey: "footer.postPosition" },
      { to: "/employer", labelKey: "footer.employerDashboard" },
      { to: "/register", labelKey: "footer.createEmployerAccount" },
      { to: "/employer/applicants", labelKey: "footer.applicantTracking" },
    ],
  },
  {
    titleKey: "footer.platform",
    links: [
      { to: "/login", labelKey: "nav.signIn" },
      { to: "/register", labelKey: "nav.createAccount" },
      { to: "/admin", labelKey: "footer.adminPortal" },
    ],
  },
];

const LINK_CLASS =
  "inline-flex min-h-8 items-center text-muted transition-colors hover:text-primary-text";

/** Public site footer (hidden on routes listed in chrome-visibility.js). */
const Footer = () => {
  const { t } = useTranslation("common");
  const hidden = useHideChrome();

  if (hidden) return null;

  return (
    <footer className="border-t border-tint-line bg-tint text-muted" data-testid="footer">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 inline-flex rounded-control">
              <Brand />
            </Link>
            <p className="mb-4 max-w-sm text-sm leading-relaxed">{t("footer.mission")}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <FaShieldAlt className="text-brand-green" aria-hidden="true" />
                {t("footer.verified")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FaBolt className="text-brand-orange" aria-hidden="true" />
                {t("footer.fast")}
              </span>
            </div>
          </div>

          {COLUMNS.map(({ titleKey, links }) => (
            <nav key={titleKey} aria-label={t(titleKey)} className="min-w-0">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink">
                {t(titleKey)}
              </h2>
              <ul className="space-y-1 text-sm">
                {links.map(({ to, labelKey }) => (
                  <li key={`${to}-${labelKey}`}>
                    <Link to={to} className={LINK_CLASS}>
                      {t(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-tint-line pt-6 text-xs sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="max-w-md text-center sm:text-right">{t("footer.note")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
