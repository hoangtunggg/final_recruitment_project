import { useTranslation } from "react-i18next";
import { Spinner } from "../ui";

/** Full-screen "checking your session / permissions" state shared by the route guards. */
const AuthGateLoading = ({ message }) => {
  const { t } = useTranslation("auth");
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4 text-primary-500">
        <Spinner size="lg" label={message || t("guard.checking")} />
        <p className="font-medium text-muted" aria-hidden="true">
          {message || t("guard.checking")}
        </p>
      </div>
    </div>
  );
};

export default AuthGateLoading;
