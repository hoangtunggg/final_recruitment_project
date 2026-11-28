import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui";

/**
 * Sign in + Create account for visitors.
 * Props: variant "desktop" (inline pills) | "mobile" (stacked full width), onNavigate (closes the drawer).
 */
const NavbarGuestActions = ({ variant = "desktop", onNavigate }) => {
  const { t } = useTranslation("common");
  const mobile = variant === "mobile";
  return (
    <div className={mobile ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <Button
        as={Link}
        to="/login"
        variant={mobile ? "outline" : "ghost"}
        size="md"
        fullWidth={mobile}
        onClick={onNavigate}
        data-testid="nav-login"
      >
        {t("nav.signIn")}
      </Button>
      <Button
        as={Link}
        to="/register"
        size="md"
        fullWidth={mobile}
        onClick={onNavigate}
        data-testid="nav-register"
      >
        {t("nav.createAccount")}
      </Button>
    </div>
  );
};

export default NavbarGuestActions;
