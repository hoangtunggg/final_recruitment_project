import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBars, FaTimes } from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import LanguageToggle from "../common/LanguageToggle";
import ThemeToggle from "../common/ThemeToggle";
import NotificationDropdown from "../Notifications/NotificationDropdown";
import { Brand, TopBar } from "../ui";
import { useHideChrome } from "./chrome-visibility";
import NavbarAccountMenu from "./navbar/NavbarAccountMenu";
import NavbarGuestActions from "./navbar/NavbarGuestActions";
import NavbarLinks from "./navbar/NavbarLinks";
import NavbarMobileMenu from "./navbar/NavbarMobileMenu";
import NavbarStaffActions from "./navbar/NavbarStaffActions";
import { getDashboardPath, useNavItems } from "./navbar/navbar-helpers";

/**
 * Public site header: 5-colour top bar + sticky navigation.
 * Hidden on routes listed in chrome-visibility.js (admin, employer, dashboard, interview).
 */
const Navbar = () => {
  const { t } = useTranslation("common");
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const hidden = useHideChrome();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCandidate = isAuthenticated && user?.role !== "admin" && user?.role !== "employer";
  const closeMenu = () => setMobileOpen(false);
  const items = useNavItems({ isCandidate, closeMenu });

  if (hidden) return null;

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const staffLoggedIn = isAuthenticated && !isCandidate;
  const showPublicLinks = !isAuthenticated || isCandidate;

  return (
    <header className="sticky top-0 z-50 border-b border-tint-line bg-surface" data-testid="navbar">
      <TopBar />
      <nav aria-label={t("nav.main")} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link
            to={staffLoggedIn ? getDashboardPath(user?.role) : "/"}
            onClick={staffLoggedIn ? closeMenu : items[0].onClick}
            className="rounded-control"
          >
            <Brand showTagline />
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-1 md:flex lg:gap-2">
            {showPublicLinks && <NavbarLinks items={items} />}

            <div className="ml-2 flex items-center gap-2 border-l border-line pl-3">
              {isCandidate ? (
                <>
                  <NotificationDropdown />
                  <NavbarAccountMenu user={user} onLogout={handleLogout} />
                </>
              ) : staffLoggedIn ? (
                <NavbarStaffActions user={user} onLogout={handleLogout} />
              ) : (
                <NavbarGuestActions />
              )}
              <LanguageToggle className="ml-1" />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile: language switch + bell stay one tap away, the rest lives in the drawer */}
          <div className="flex items-center gap-1 md:hidden">
            <LanguageToggle size="sm" />
            {isAuthenticated && <NotificationDropdown />}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-ink hover:bg-tint"
              aria-label={t("nav.toggleMenu")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? (
                <FaTimes className="h-6 w-6" aria-hidden="true" />
              ) : (
                <FaBars className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <NavbarMobileMenu
            items={items}
            user={user}
            isAuthenticated={isAuthenticated}
            isCandidate={isCandidate}
            onNavigate={closeMenu}
            onLogout={handleLogout}
          />
        )}
      </nav>
    </header>
  );
};

export default Navbar;
