import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, TopBar } from "../../../components/ui";

/** Closing call to action: browse jobs and sign up / open the dashboard. */
const HomeFinalCta = ({ isAuthenticated, dashboardPath, onBrowse }) => {
  const { t } = useTranslation("public");
  return (
    <section className="bg-canvas">
      <TopBar className="h-1.5" />
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t("home.finalCta.title")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted">{t("home.finalCta.description")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onBrowse}>
            {t("home.finalCta.browse")}
          </Button>
          <Button as={Link} to={isAuthenticated ? dashboardPath : "/register"} size="lg" variant="outline">
            {isAuthenticated ? t("home.finalCta.dashboard") : t("home.finalCta.register")}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeFinalCta;
