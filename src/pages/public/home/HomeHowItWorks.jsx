import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowRight, FaBuilding, FaClock, FaShieldAlt, FaUserCheck } from "react-icons/fa";
import { Card, PageHeader } from "../../../components/ui";

const PILLARS = [
  { id: "verified", icon: FaShieldAlt },
  { id: "direct", icon: FaUserCheck },
  { id: "status", icon: FaClock },
  { id: "dashboards", icon: FaBuilding },
];
const STEP_IDS = ["1", "2", "3"];

const Steps = ({ group }) => {
  const { t } = useTranslation("public");
  return (
    <ol className="space-y-5">
      {STEP_IDS.map((step) => (
        <li key={step} className="flex items-start gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tint-line bg-tint font-bold text-primary-text">
            {step}
          </span>
          <div>
            <h4 className="font-bold text-ink">{t(`home.how.${group}.steps.${step}.title`)}</h4>
            <p className="mt-1 leading-relaxed text-muted">{t(`home.how.${group}.steps.${step}.description`)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

/** Value pillars + the two "how it works" lists (candidates / employers). */
const HomeHowItWorks = ({ postJobPath, onBrowse }) => {
  const { t } = useTranslation("public");
  const linkClass = "inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-primary-text";

  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-page px-4">
        <ul className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li key={pillar.id}>
                <Card tone="tint" shadow={false} padding="md" className="h-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{t(`home.pillars.${pillar.id}.title`)}</h3>
                  <p className="mt-1 text-muted">{t(`home.pillars.${pillar.id}.description`)}</p>
                </Card>
              </li>
            );
          })}
        </ul>

        <PageHeader level={2} eyebrow={t("home.how.eyebrow")} title={t("home.how.title")} subtitle={t("home.how.subtitle")} className="mb-8" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card padding="lg">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">{t("home.how.candidates.badge")}</p>
            <h3 className="mb-6 mt-1 text-2xl font-bold text-ink">{t("home.how.candidates.title")}</h3>
            <Steps group="candidates" />
            <div className="mt-6 border-t border-line pt-4">
              <button type="button" onClick={onBrowse} className={linkClass}>
                {t("home.how.candidates.cta")} <FaArrowRight className="text-xs" aria-hidden="true" />
              </button>
            </div>
          </Card>
          <Card padding="lg">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">{t("home.how.employers.badge")}</p>
            <h3 className="mb-6 mt-1 text-2xl font-bold text-ink">{t("home.how.employers.title")}</h3>
            <Steps group="employers" />
            <div className="mt-6 border-t border-line pt-4">
              <Link to={postJobPath} className={linkClass}>
                {t("home.how.employers.cta")} <FaArrowRight className="text-xs" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HomeHowItWorks;
