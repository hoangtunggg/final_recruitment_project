import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Tailwind `lg` breakpoint: below it the sidebar is a mobile drawer that is never collapsed.
const DESKTOP_QUERY = "(min-width: 1024px)";

const subscribeDesktop = (onChange) => {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

// localStorage can throw (private mode, blocked site data): fall back to the default (expanded).
const readCollapsed = (storageKey) => {
  try {
    return window.localStorage.getItem(storageKey) === "collapsed";
  } catch {
    return false;
  }
};
const writeCollapsed = (storageKey, collapsed) => {
  try {
    window.localStorage.setItem(storageKey, collapsed ? "collapsed" : "expanded");
  } catch {
    /* preference just won't persist */
  }
};

/**
 * Desktop collapse state shared by the admin and employer sidebars.
 * @param {string} storageKey localStorage key, e.g. "sidebar:admin"; value is "collapsed" | "expanded".
 * @returns {{ collapsed: boolean, rail: boolean, toggleCollapsed: () => void }}
 *   collapsed: the saved preference (default expanded)
 *   rail: collapsed AND viewport is lg+ -> render the icon-only rail (the mobile drawer is always full width)
 */
export default function useCollapsibleSidebar(storageKey) {
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey));
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, () => false);

  useEffect(() => {
    writeCollapsed(storageKey, collapsed);
  }, [storageKey, collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), []);

  return { collapsed, rail: collapsed && isDesktop, toggleCollapsed };
}
