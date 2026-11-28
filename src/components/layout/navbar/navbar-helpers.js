import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Where the role's home screen lives. */
export const getDashboardPath = (role) => {
  if (role === "admin") return "/admin";
  if (role === "employer") return "/employer";
  return "/dashboard";
};

/** Up to two initials for the avatar bubble. */
export const getInitials = (user, fallback) =>
  (user?.name || user?.email || fallback)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * Items of the public top navigation (shared by desktop bar and mobile drawer).
 * Home / Browse Jobs / Categories scroll to the homepage section when already on "/",
 * otherwise navigate to it. The AI Interview entry is only offered to candidates.
 */
export const useNavItems = ({ isCandidate, closeMenu }) => {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();

  const goHome = useCallback(
    (event) => {
      closeMenu();
      event.preventDefault();
      if (pathname === "/") {
        if (window.location.hash) window.history.pushState(null, "", "/");
      } else {
        navigate("/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [closeMenu, navigate, pathname]
  );

  const goToSection = useCallback(
    (sectionHash, elementIds) => (event) => {
      closeMenu();
      event.preventDefault();
      if (pathname === "/") {
        const target = elementIds.map((id) => document.getElementById(id)).find(Boolean);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `/#${sectionHash}`);
        }
      } else {
        navigate(`/#${sectionHash}`);
      }
    },
    [closeMenu, navigate, pathname]
  );

  const items = [
    {
      key: "home",
      labelKey: "nav.home",
      to: "/",
      active: pathname === "/" && !hash,
      onClick: goHome,
    },
    {
      key: "browse",
      labelKey: "nav.browseJobs",
      to: "/#browse-jobs",
      active: hash === "#browse-jobs" || hash === "#featured-jobs",
      onClick: goToSection("browse-jobs", ["browse-jobs", "featured-jobs"]),
    },
    {
      key: "categories",
      labelKey: "nav.categories",
      to: "/#categories",
      active: hash === "#categories",
      onClick: goToSection("categories", ["categories"]),
    },
  ];

  if (isCandidate) {
    items.push({
      key: "interview",
      labelKey: "nav.aiInterview",
      to: "/interview",
      active: pathname.startsWith("/interview"),
      onClick: closeMenu,
    });
  }
  return items;
};
