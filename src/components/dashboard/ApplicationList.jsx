import { useState, useMemo } from "react";
import {
  FiSearch,
  FiBriefcase,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import ApplicationCard from "./ApplicationCard";

const STATUS_FILTERS = [
  { id: "all", label: "All Statuses" },
  { id: "pending", label: "Pending" },
  { id: "under_review", label: "Under Review" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interviews" },
  { id: "offered", label: "Offered" },
  { id: "rejected", label: "Not Selected" },
  { id: "withdrawn", label: "Withdrawn" },
];

const ApplicationSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-5 sm:p-6 animate-pulse">
    <div className="flex justify-between items-start gap-4 mb-4">
      <div className="w-1/2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="w-24 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full my-6"></div>
    <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  </div>
);

const ApplicationList = ({
  applications = [],
  loading = false,
  error = null,
  initialStatus = "all",
  onRetry,
  onExplore,
  onWithdraw,
  onFeedback,
  actionLoadingId = null,
}) => {
  const [search, setSearch] = useState("");
  const [prevInitialStatus, setPrevInitialStatus] = useState(initialStatus);
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");

  if (initialStatus !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus);
    setStatusFilter(initialStatus || "all");
  }

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const title = app.job?.title || app.jobTitle || "";
      const company = app.job?.company || app.company || "";
      const location = app.job?.location || "";
      const status = app.status || "pending";

      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        company.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query);

      let matchesStatus = true;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "interview") {
        matchesStatus =
          status === "interview_scheduled" || status === "interviewed";
      } else if (statusFilter === "offered") {
        matchesStatus = status === "offered" || status === "accepted";
      } else {
        matchesStatus = status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-4 transition-colors">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 flex min-h-11 items-center px-4 bg-white dark:bg-gray-700 rounded-lg border border-slate-300 dark:border-gray-600 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-500/30 transition-colors">
            <FiSearch className="text-gray-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by position, company, or location..."
              className="w-full bg-transparent outline-none text-base text-slate-900 dark:text-white placeholder-slate-500 border-none p-0 focus:ring-0"
              aria-label="Search applications"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                aria-label="Clear search"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-h-11 px-3.5 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-sm font-medium text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium mr-1 flex items-center gap-1">
            <FiFilter className="text-[10px]" /> Status:
          </span>
          {STATUS_FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`inline-flex min-h-9 items-center px-3 rounded-lg font-medium text-sm transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-650"
                }`}
              >
                {filter.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-11 text-sm text-red-700 dark:text-red-300 hover:underline ml-auto font-medium cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Listing Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ApplicationSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6 max-w-md mx-auto shadow-sm">
          <FiAlertCircle className="text-3xl text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Failed to load applications
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-6 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="text-2xl" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
            {hasActiveFilters
              ? "No applications match your filter"
              : "No applications submitted yet"}
          </h3>
          <p className="text-sm text-slate-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search keywords or resetting your status filter."
              : "Discover verified opportunities matching your ambition and apply with your profile."}
          </p>

          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 px-4 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
              >
                Clear Filters
              </button>
            ) : (
              onExplore && (
                <button
                  type="button"
                  onClick={onExplore}
                  className="min-h-11 px-4 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  Explore Recommended Jobs
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-gray-300 px-1">
            <span>
              Showing{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                {filteredApplications.length}
              </strong>{" "}
              of {applications.length} applications
            </span>
          </div>

          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id || app._id}
              application={app}
              onWithdraw={onWithdraw}
              onFeedback={onFeedback}
              actionLoadingId={actionLoadingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
