import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import { Button, Card } from "../../components/ui";

const NotFoundPage = () => {
  const { t } = useTranslation("public");
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-12">
      <Card padding="lg" className="w-full max-w-lg text-center" data-testid="not-found">
        <p className="text-6xl font-extrabold tracking-tight text-primary-text">404</p>
        <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">{t("notFound.heading")}</h1>
        <p className="mt-3 leading-relaxed text-muted">{t("notFound.description")}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button as={Link} to="/" leftIcon={<FaHome />}>
            {t("notFound.home")}
          </Button>
          <Button variant="outline" leftIcon={<FaArrowLeft />} onClick={() => window.history.back()}>
            {t("notFound.back")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;
