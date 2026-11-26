import { Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";

  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const getTypeBadgeClass = (type) => {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("remote")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (normalized.includes("part-time")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
  if (normalized.includes("contract")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  }
  if (normalized.includes("internship")) {
    return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
  }
  return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
};

const getCompanyInitials = (name) => {
  if (!name) return "CO";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarGradient = (name = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const gradients = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-purple-600",
    "from-violet-600 to-fuchsia-600",
    "from-teal-600 to-emerald-600",
  ];
  return gradients[charCode % gradients.length];
};

const JobCard = ({ job }) => {
  if (!job) return null;

  const initials = getCompanyInitials(job.company);
  const avatarGradient = getAvatarGradient(job.company);
  const postedText = formatTimeAgo(job.createdAt || job.posted);

  const skillsList = job.skills
    ? job.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex min-h-56 min-w-0 flex-col justify-between rounded-xl border border-slate-300 bg-white p-4 transition-colors hover:border-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-sm min-w-0">
                <span className="truncate">{job.company}</span>
                <FaShieldAlt
                  className="text-blue-500 text-[11px] shrink-0"
                  title="Verified Organization"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-gray-300 mt-1">
                <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
                <span className="truncate">{job.location || "Remote"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {job.type && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-md border whitespace-nowrap ${getTypeBadgeClass(
                  job.type
                )}`}
              >
                {job.type}
              </span>
            )}
          </div>
        </div>

        <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-snug line-clamp-2 min-h-12">
          {job.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {job.salary && (
            <span className="inline-flex items-center gap-1 font-semibold text-green-700 dark:text-green-300 min-w-0">
              <FaDollarSign className="text-emerald-600 dark:text-emerald-400 text-[11px]" />
              <span className="truncate">{job.salary}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-gray-300 font-medium whitespace-nowrap">
            <FaClock className="text-[10px]" />
            <span>{postedText}</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.experience && (
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
              {job.experience}
            </span>
          )}
          {skillsList.slice(0, 2).map((skill, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-md font-medium bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-200"
              >
                {skill}
              </span>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600 dark:text-gray-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-600" />
          <span>Actively hiring</span>
        </span>
        <span className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <span>View job</span>
          <FaArrowRight className="text-xs" />
        </span>
      </div>
    </Link>
  );
};

export default JobCard;
