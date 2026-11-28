import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaSignOutAlt } from "react-icons/fa";
import { CANDIDATE_DESTINATIONS } from "./candidateDestinations";
import { getInitials } from "./navbar-helpers";

/**
 * Desktop candidate account dropdown (avatar button + menu).
 * Props: user, onLogout. Closes on outside click and Escape.
 */
const NavbarAccountMenu = ({ user, onLogout }) => {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const name = user?.name || user?.email?.split("@")[0] || t("nav.candidateFallback");

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface py-1 pl-1 pr-3 text-sm font-semibold text-ink transition-colors hover:border-primary-500 hover:bg-tint"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.accountMenu")}
        data-testid="account-menu-button"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white ring-4 ring-primary-500/15">
          {getInitials(user, t("nav.candidateFallback"))}
        </span>
        <span className="hidden max-w-28 truncate lg:block">{name}</span>
        <FaChevronDown
          className={`text-xs text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-card border border-tint-line bg-surface py-2 shadow-card"
        >
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate text-sm font-bold text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="p-1.5">
            {CANDIDATE_DESTINATIONS.map(({ labelKey, to, icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium text-ink hover:bg-tint hover:text-primary-text"
              >
                <span className="text-sm text-primary-text">{icon}</span>
                {t(labelKey)}
              </Link>
            ))}
          </div>
          <div className="border-t border-line px-1.5 pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-sm font-semibold text-danger hover:bg-danger/10"
            >
              <FaSignOutAlt aria-hidden="true" />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarAccountMenu;
