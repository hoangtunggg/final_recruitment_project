import { useLocation } from "react-router-dom";

/**
 * Route prefixes that render their own full-screen layout (sidebars / own header),
 * so the public Navbar and Footer are hidden there. Add a prefix here to opt a new
 * area out of the shared chrome.
 */
export const HIDE_CHROME_PREFIXES = ["/admin", "/employer", "/dashboard", "/interview"];

/** True when the current route should not show the public Navbar / Footer. */
export const useHideChrome = () => {
  const { pathname } = useLocation();
  return HIDE_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};
