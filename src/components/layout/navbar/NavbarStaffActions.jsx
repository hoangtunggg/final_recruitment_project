import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlus, FaTachometerAlt, FaUserCircle } from "react-icons/fa";
import { useEnumLabel } from "../../../i18n/helpers";
import NotificationDropdown from "../../Notifications/NotificationDropdown";
import { Badge, Button } from "../../ui";
import { getDashboardPath } from "./navbar-helpers";

const dashboardLabelKey = (role) => {
  if (role === "admin") return "nav.adminDashboard";
  if (role === "employer") return "nav.employerDashboard";
  return "nav.myDashboard";
};

/**
 * Admin / employer actions shown on public pages: dashboard, post job, notifications, identity, sign out.
 * Props: user, variant "desktop" | "mobile", onNavigate (closes the drawer), onLogout.
 */
const NavbarStaffActions = ({ user, variant = "desktop", onNavigate, onLogout }) => {
  const { t } = useTranslation("common");
  const roleLabel = useEnumLabel();
  const mobile = variant === "mobile";
  const canPost = user?.role === "employer" || user?.role === "admin";
  const postPath = user?.role === "admin" ? "/admin/jobs/add" : "/employer/post-job";
  const name = user?.name || user?.email?.split("@")[0] || t("nav.userFallback");

  return (
    <div className={mobile ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <Button
        as={Link}
        to={getDashboardPath(user?.role)}
        variant="outline"
        size="sm"
        fullWidth={mobile}
        leftIcon={<FaTachometerAlt aria-hidden="true" />}
        onClick={onNavigate}
      >
        {t(dashboardLabelKey(user?.role))}
      </Button>

      {canPost && (
        <Button
          as={Link}
          to={postPath}
          size="sm"
          fullWidth={mobile}
          leftIcon={<FaPlus aria-hidden="true" />}
          onClick={onNavigate}
        >
          {t(mobile ? "nav.postAJob" : "nav.postJob")}
        </Button>
      )}

      {!mobile && <NotificationDropdown />}

      <div className={`flex items-center gap-2 ${mobile ? "px-1 py-1" : ""}`}>
        <FaUserCircle className="text-lg text-muted" aria-hidden="true" />
        <span className="max-w-32 truncate text-sm font-semibold text-ink">{name}</span>
        <Badge tone="primary" size="sm">
          {roleLabel("userRole", user?.role || "seeker")}
        </Badge>
      </div>

      <Button variant="ghost" size="sm" fullWidth={mobile} onClick={onLogout}>
        {t("nav.signOut")}
      </Button>
    </div>
  );
};

export default NavbarStaffActions;
