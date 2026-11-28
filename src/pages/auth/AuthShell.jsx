import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCheckCircle } from "react-icons/fa";
import { Brand, Card } from "../../components/ui";

const HIGHLIGHTS = ["verified", "direct", "interview"];

/**
 * Two-column layout shared by Login and Register: a teal brand panel (desktop only)
 * and the form card. `mode` selects the copy ("login" | "register").
 */
const AuthShell = ({ mode, children }) => {
  const { t } = useTranslation("auth");
  return (
    <div className="bg-canvas">
      <div className="mx-auto grid min-h-[75vh] max-w-page items-center gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[1fr_minmax(0,34rem)] lg:gap-16">
        <aside className="hidden lg:block">
          <Link to="/" aria-label={t("shell.home")} className="inline-flex">
            <Brand size="lg" showTagline />
          </Link>
          <h1 className="mt-8 max-w-lg text-4xl font-extrabold leading-tight text-ink">{t(`shell.${mode}.title`)}</h1>
          <p className="mt-4 max-w-lg text-xl leading-8 text-muted">{t(`shell.${mode}.subtitle`)}</p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-lg text-ink">
                <FaCheckCircle className="mt-1 shrink-0 text-primary-500" aria-hidden="true" />
                <span>{t(`shell.highlights.${item}`)}</span>
              </li>
            ))}
          </ul>
        </aside>

        <Card padding="lg" className="w-full">
          <div className="mb-6 lg:hidden">
            <h1 className="text-3xl font-extrabold leading-tight text-ink">{t(`shell.${mode}.title`)}</h1>
            <p className="mt-2 text-muted">{t(`shell.${mode}.subtitle`)}</p>
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
};

export default AuthShell;
