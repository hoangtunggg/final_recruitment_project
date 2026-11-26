import React from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiBookmark,
  FiUpload,
  FiArrowRight,
} from "react-icons/fi";

const DashboardHeader = ({ user, stats, onTabChange }) => {
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "JS";

  return (
    <div className="mb-5">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-4 sm:p-5 transition-colors mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* User Profile Info */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-700 text-white font-bold text-base flex items-center justify-center flex-shrink-0">
              {userInitials}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, {user?.name || "Job Seeker"}!
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 uppercase tracking-wide">
                  Candidate
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>{user?.email}</span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your applications, active interviews, and credentials
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onTabChange("resumes")}
              className="inline-flex min-h-11 items-center gap-2 px-4 rounded-lg border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-sm transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
            >
              <FiUpload className="text-sm text-blue-600 dark:text-blue-400" />
              <span>Manage Resumes</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("recommended")}
              className="inline-flex min-h-11 items-center gap-2 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-sm transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <FiBriefcase className="text-sm" />
              <span>Explore Opportunities</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Interactive navigation cards) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Applications */}
        <button
          type="button"
          onClick={() => onTabChange("applications", "all")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 p-4 transition-colors text-left group cursor-pointer min-h-28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                Applications
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.applied ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg flex-shrink-0">
              <FiBriefcase />
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-gray-300 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>View all submitted</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-blue-600" />
          </div>
        </button>

        {/* Interviews Scheduled */}
        <button
          type="button"
          onClick={() => onTabChange("applications", "interview")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 p-4 transition-colors text-left group cursor-pointer min-h-28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                Interviews
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.interviews ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg flex-shrink-0">
              <FiCalendar />
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-gray-300 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>Active interview stage</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-blue-600" />
          </div>
        </button>

        {/* Job Offers */}
        <button
          type="button"
          onClick={() => onTabChange("applications", "offered")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 p-4 transition-colors text-left group cursor-pointer min-h-28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                Job Offers
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.offers ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg flex-shrink-0">
              <FiCheckCircle />
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-gray-300 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>Received offers</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-blue-600" />
          </div>
        </button>

        {/* Saved Jobs */}
        <button
          type="button"
          onClick={() => onTabChange("saved")}
          className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400 p-4 transition-colors text-left group cursor-pointer min-h-28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                Saved Jobs
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.saved ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg flex-shrink-0">
              <FiBookmark />
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-gray-300 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <span>Bookmarked listings</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform text-blue-600" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
