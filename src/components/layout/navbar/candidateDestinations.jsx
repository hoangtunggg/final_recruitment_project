import {
  FaBriefcase,
  FaBookmark,
  FaFileAlt,
  FaRobot,
  FaStar,
  FaTachometerAlt,
} from "react-icons/fa";

/** Candidate account shortcuts (labels live in common:nav.*). Used by desktop menu and mobile drawer. */
export const CANDIDATE_DESTINATIONS = [
  { labelKey: "nav.overview", to: "/dashboard#overview", icon: <FaTachometerAlt aria-hidden="true" /> },
  { labelKey: "nav.applications", to: "/dashboard#applications", icon: <FaBriefcase aria-hidden="true" /> },
  { labelKey: "nav.savedJobs", to: "/dashboard#saved", icon: <FaBookmark aria-hidden="true" /> },
  { labelKey: "nav.recommendedJobs", to: "/dashboard#recommended", icon: <FaStar aria-hidden="true" /> },
  { labelKey: "nav.resumes", to: "/dashboard#resumes", icon: <FaFileAlt aria-hidden="true" /> },
  { labelKey: "nav.aiInterview", to: "/interview", icon: <FaRobot aria-hidden="true" /> },
];
