import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSignOutAlt } from "react-icons/fa";
import LanguageToggle from "../../common/LanguageToggle";
import ThemeToggle from "../../common/ThemeToggle";
import { CANDIDATE_DESTINATIONS } from "./candidateDestinations";
import { getInitials } from "./navbar-helpers";
import NavbarGuestActions from "./NavbarGuestActions";
import NavbarLinks from "./NavbarLinks";
import NavbarStaffActions from "./NavbarStaffActions";

/**
 * Mobile navigation drawer (below md). Props: items (useNavItems), user, isAuthenticated,
 * isCandidate, onNavigate (close drawer), onLogout.
 */
const NavbarMobileMenu = ({ items, user, isAuthenticated, isCandidate, onNavigate, onLogout }) => {
  const { t } = useTranslation("common");

  return (
    <div
      id="mobile-navigation"
      className="space-y-1 border-t border-line py-3 md:hidden"
      data-testid="mobile-menu"
    >
      {(!isAuthenticated || isCandidate) && <NavbarLinks items={items} variant="mobile" />}

      {isCandidate ? (
        <div className="space-y-1 border-t border-line pt-3">
          <div className="mb-2 flex items-center gap-3 rounded-card bg-tint px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {getInitials(user, t("nav.candidateFallback"))}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">
                {user?.name || t("nav.candidateFallback")}
              </span>
              <span className="block truncate text-xs text-muted">{user?.email}</span>
            </span>
          </div>
          {CANDIDATE_DESTINATIONS.filter(({ to }) => to !== "/interview").map(
            ({ labelKey, to, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={onNavigate}
                className="flex min-h-11 items-center gap-3 rounded-control px-3 text-base font-medium text-ink hover:bg-tint hover:text-primary-text"
              >
                <span className="text-sm text-primary-text">{icon}</span>
                {t(labelKey)}
              </Link>
            )
          )}
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-base font-semibold text-danger hover:bg-danger/10"
          >
            <FaSignOutAlt aria-hidden="true" />
            {t("nav.signOut")}
          </button>
        </div>
      ) : isAuthenticated ? (
        <div className="border-t border-line pt-3">
          <NavbarStaffActions
            user={user}
            variant="mobile"
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        </div>
      ) : (
        <div className="border-t border-line pt-3">
          <NavbarGuestActions variant="mobile" onNavigate={onNavigate} />
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-line px-1 pt-3">
        <span className="text-sm font-medium text-muted">{t("theme.appearance")}</span>
        <ThemeToggle showLabel size="sm" />
      </div>
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-sm font-medium text-muted">{t("language.label")}</span>
        <LanguageToggle showLabel size="sm" />
      </div>
    </div>
  );
};

export default NavbarMobileMenu;
