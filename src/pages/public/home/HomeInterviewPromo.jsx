import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowRight, FaCheckCircle, FaMicrophoneAlt, FaRobot, FaUser } from "react-icons/fa";
import { Button } from "../../../components/ui";

const POINTS = ["tracks", "voice", "report"];

/** Decorative sample conversation (illustration only, hidden from assistive tech). */
const ChatPreview = () => {
  const { t } = useTranslation("public");
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm space-y-3 rounded-card border border-tint-line bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
          <FaRobot />
        </span>
        <p className="rounded-2xl rounded-tl-sm bg-tint px-4 py-2.5 text-sm text-ink">{t("home.promo.sampleQuestion")}</p>
      </div>
      <div className="flex flex-row-reverse items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
          <FaUser />
        </span>
        <p className="rounded-2xl rounded-tr-sm border border-line px-4 py-2.5 text-sm text-ink">{t("home.promo.sampleAnswer")}</p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-1 text-sm font-semibold text-primary-text">
        <FaMicrophoneAlt />
        <span className="flex items-end gap-0.5">
          {[10, 18, 12, 22, 14].map((height, index) => (
            <span key={index} className="w-1 rounded-full bg-primary-500" style={{ height }} />
          ))}
        </span>
      </div>
    </div>
  );
};

/** Promo block that sends everyone to the AI interview practice (/interview). */
const HomeInterviewPromo = () => {
  const { t } = useTranslation("public");
  return (
    <section data-testid="home-interview-promo" className="bg-canvas pb-12 sm:pb-16">
      <div className="mx-auto max-w-page px-4">
        <div className="relative overflow-hidden rounded-card border border-tint-line bg-tint p-6 shadow-card sm:p-10 lg:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[36px] border-primary-500/10" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">{t("home.promo.eyebrow")}</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{t("home.promo.title")}</h2>
              <p className="mt-3 max-w-xl text-lg text-muted">{t("home.promo.description")}</p>
              <ul className="mt-6 space-y-3">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-ink">
                    <FaCheckCircle className="mt-1 shrink-0 text-primary-500" aria-hidden="true" />
                    <span>{t(`home.promo.points.${point}`)}</span>
                  </li>
                ))}
              </ul>
              <Button as={Link} to="/interview" size="lg" className="mt-8" rightIcon={<FaArrowRight />} data-testid="home-interview-cta">
                {t("home.promo.cta")}
              </Button>
            </div>
            <ChatPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeInterviewPromo;
