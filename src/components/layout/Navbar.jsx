import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaPlus,
  FaTachometerAlt,
  FaBriefcase,
  FaBookmark,
  FaStar,
  FaFileAlt,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import NotificationDropdown from "../Notifications/NotificationDropdown";
import ThemeToggle from "../common/ThemeToggle";

const CANDIDATE_DESTINATIONS = [
  { label: "Overview", to: "/dashboard#overview", icon: <FaTachometerAlt aria-hidden="true" /> },
  { label: "Applications", to: "/dashboard#applications", icon: <FaBriefcase aria-hidden="true" /> },
  { label: "Saved Jobs", to: "/dashboard#saved", icon: <FaBookmark aria-hidden="true" /> },
  { label: "Recommended Jobs", to: "/dashboard#recommended", icon: <FaStar aria-hidden="true" /> },
  { label: "Resumes", to: "/dashboard#resumes", icon: <FaFileAlt aria-hidden="true" /> },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const isCandidate =
    isAuthenticated && user?.role !== "admin" && user?.role !== "employer";

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeAccountMenu = (event) => {
      if (
        event.type === "keydown" &&
        event.key !== "Escape"
      ) {
        return;
      }
      if (
        event.type === "mousedown" &&
        accountMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeAccountMenu);
    document.addEventListener("keydown", closeAccountMenu);
    return () => {
      document.removeEventListener("mousedown", closeAccountMenu);
      document.removeEventListener("keydown", closeAccountMenu);
    };
  }, [accountMenuOpen]);

  // Hide the public Navbar on dedicated dashboard layouts (Admin, Employer, and Job Seeker portals)
  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/employer") ||
    location.pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "employer") return "/employer";
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (user?.role === "admin") return "Admin Dashboard";
    if (user?.role === "employer") return "Employer Dashboard";
    return "My Dashboard";
  };

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/" && !location.hash) return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMenu = () => setMobileMenuOpen(false);
  const closeAccountMenu = () => setAccountMenuOpen(false);

  const candidateInitials = (user?.name || user?.email || "Candidate")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleHomeClick = (e) => {
    closeMenu();
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash) {
        window.history.pushState(null, "", "/");
      }
    } else {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBrowseJobsClick = (e) => {
    closeMenu();
    if (location.pathname === "/") {
      e.preventDefault();
      const target =
        document.getElementById("browse-jobs") ||
        document.getElementById("featured-jobs");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", "/#browse-jobs");
      }
    } else {
      navigate("/#browse-jobs");
    }
  };

  const handleCategoriesClick = (e) => {
    closeMenu();
    if (location.pathname === "/") {
      e.preventDefault();
      const target = document.getElementById("categories");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", "/#categories");
      }
    } else {
      navigate("/#categories");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-slate-300 dark:border-gray-700 transition-colors" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Brand Logo */}
          <Link
            to={isAuthenticated && !isCandidate ? getDashboardPath() : "/"}
            onClick={isAuthenticated && !isCandidate ? closeMenu : handleHomeClick}
            className="flex items-center space-x-2.5 group rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <img
              src="/logo.png"
              alt="JobPortal Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                JobPortal
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Careers & Talent
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {(!isAuthenticated || isCandidate) && (
              <>
                <Link
                  to="/"
              onClick={handleHomeClick}
              className={`inline-flex min-h-11 items-center px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                isActive("/")
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              }`}
            >
              Home
            </Link>

            <Link
              to="/#browse-jobs"
              onClick={handleBrowseJobsClick}
              className={`inline-flex min-h-11 items-center px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                location.hash === "#browse-jobs" || location.hash === "#featured-jobs"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              }`}
            >
              Browse Jobs
            </Link>

            <Link
              to="/#categories"
              onClick={handleCategoriesClick}
              className={`inline-flex min-h-11 items-center px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                location.hash === "#categories"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              }`}
            >
              Categories
                </Link>
              </>
            )}

            {isCandidate ? (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-gray-700">
                <NotificationDropdown />
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    aria-label="Open Candidate account menu"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      {candidateInitials}
                    </span>
                    <span className="hidden max-w-28 truncate lg:block">
                      {user?.name || user?.email?.split("@")[0] || "Candidate"}
                    </span>
                    <FaChevronDown
                      className={`text-xs text-slate-500 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  {accountMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-300 bg-white py-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                    >
                      <div className="border-b border-slate-200 px-4 pb-3 pt-1 dark:border-gray-700">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {user?.name || "Candidate"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-gray-300">
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-1.5">
                        {CANDIDATE_DESTINATIONS.map(({ label, to, icon }) => (
                          <Link
                            key={to}
                            to={to}
                            role="menuitem"
                            onClick={closeAccountMenu}
                            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                          >
                            <span className="text-sm" aria-hidden="true">{icon}</span>
                            {label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-slate-200 px-1.5 pt-1.5 dark:border-gray-700">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
                        >
                          <FaSignOutAlt aria-hidden="true" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                {/* Role-based dashboard link */}
                <Link
                  to={getDashboardPath()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(getDashboardPath())
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <FaTachometerAlt className="text-xs" />
                  <span>{getDashboardLabel()}</span>
                </Link>

                {/* Quick Post Job action for Employer/Admin */}
                {(user?.role === "employer" || user?.role === "admin") && (
                  <Link
                    to={user?.role === "admin" ? "/admin/jobs/add" : "/employer/post-job"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <FaPlus className="text-xs" />
                    <span>Post Job</span>
                  </Link>
                )}

                <NotificationDropdown />

                {/* User info & role badge */}
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                  <FaUserCircle className="text-base text-gray-500 dark:text-gray-400" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user?.role || "seeker"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/60"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center px-4 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  Create Account
                </Link>
              </div>
            )}
            <ThemeToggle className="ml-2" />
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex items-center md:hidden space-x-2">
            <ThemeToggle size="sm" />
            {isAuthenticated && <NotificationDropdown />}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-gray-700 space-y-1">
            {(!isAuthenticated || isCandidate) && (
              <>
                <Link
                  to="/"
              onClick={handleHomeClick}
              className={`flex min-h-11 items-center px-3 rounded-lg text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                isActive("/")
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Home
            </Link>

            <Link
              to="/#browse-jobs"
              onClick={handleBrowseJobsClick}
              className={`flex min-h-11 items-center px-3 rounded-lg text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                location.hash === "#browse-jobs" || location.hash === "#featured-jobs"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Browse Jobs
            </Link>

            <Link
              to="/#categories"
              onClick={handleCategoriesClick}
              className={`flex min-h-11 items-center px-3 rounded-lg text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                location.hash === "#categories"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Categories
                </Link>
              </>
            )}

            {isCandidate ? (
              <div className="space-y-1 border-t border-slate-200 pt-3 dark:border-gray-700">
                <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 dark:bg-gray-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                    {candidateInitials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                      {user?.name || "Candidate"}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-gray-300">
                      {user?.email}
                    </span>
                  </span>
                </div>
                {CANDIDATE_DESTINATIONS.map(({ label, to, icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                  >
                    <span className="text-sm" aria-hidden="true">{icon}</span>
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-base font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
                >
                  <FaSignOutAlt aria-hidden="true" />
                  Logout
                </button>
              </div>
            ) : isAuthenticated ? (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {user?.name || user?.email}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user?.role || "seeker"}
                  </span>
                </div>

                <Link
                  to={getDashboardPath()}
                  onClick={closeMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  <FaTachometerAlt />
                  <span>{getDashboardLabel()}</span>
                </Link>

                {(user?.role === "employer" || user?.role === "admin") && (
                  <Link
                    to={user?.role === "admin" ? "/admin/jobs/add" : "/employer/post-job"}
                    onClick={closeMenu}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    <FaPlus />
                    <span>Post a Job</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center px-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex min-h-11 items-center justify-center px-3 rounded-lg text-base font-medium bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  Create Account
                </Link>
              </div>
            )}

            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</span>
              <ThemeToggle showLabel={true} size="sm" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
