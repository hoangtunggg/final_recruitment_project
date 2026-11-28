/**
 * Pure helpers for the home page job browser: category definitions, filtering, sorting, counts.
 * Filter values stay the API values (Full-time, Software, under-50k ...): only labels are translated.
 */
import {
  FaLaptopCode,
  FaPaintBrush,
  FaChartLine,
  FaHandshake,
  FaMoneyBillWave,
  FaHospitalUser,
  FaHeadset,
  FaCogs,
} from "react-icons/fa";

/** `id` is also the i18n key (public:home.categories.<id>), `slug` is what goes in the URL. */
export const CATEGORIES = [
  { id: "software", slug: "Software", icon: FaLaptopCode, tone: "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300",
    keywords: ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "python", "tech", "web"] },
  { id: "design", slug: "Design", icon: FaPaintBrush, tone: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    keywords: ["design", "ui", "ux", "product design", "figma", "graphic", "creative"] },
  { id: "marketing", slug: "Marketing", icon: FaChartLine, tone: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    keywords: ["marketing", "seo", "content", "growth", "social media", "brand", "digital"] },
  { id: "sales", slug: "Sales", icon: FaHandshake, tone: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    keywords: ["sales", "account", "business development", "b2b", "revenue"] },
  { id: "finance", slug: "Finance", icon: FaMoneyBillWave, tone: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    keywords: ["finance", "accounting", "auditor", "analyst", "financial", "tax"] },
  { id: "healthcare", slug: "Healthcare", icon: FaHospitalUser, tone: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    keywords: ["health", "nurse", "medical", "doctor", "clinical", "hospital", "pharma"] },
  { id: "support", slug: "Support", icon: FaHeadset, tone: "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300",
    keywords: ["support", "customer service", "help desk", "client success", "representative"] },
  { id: "operations", slug: "Operations", icon: FaCogs, tone: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    keywords: ["operation", "operations", "hr", "human resources", "recruiter", "logistics", "management"] },
];

/** `labelKey` is an i18n key under public:home.quickTags (or an enum label when `enumGroup` is set). */
export const QUICK_TAGS = [
  { id: "remote", type: "type", value: "Remote", enumGroup: "jobType" },
  { id: "fullTime", type: "type", value: "Full-time", enumGroup: "jobType" },
  { id: "engineering", type: "category", value: "Software" },
  { id: "design", type: "category", value: "Design" },
  { id: "marketing", type: "category", value: "Marketing" },
];

export const TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
export const EXPERIENCE_OPTIONS = ["Entry Level", "Mid Level", "Senior Level", "Lead", "Manager"];
export const SALARY_OPTIONS = ["under-50k", "50-80", "80-120", "120-150", "150-200", "200k+"];

/** "$80k" / "$80000" -> 80000 */
const dollarsToNumber = (token) =>
  parseInt(token.replace(/[$kK]/g, ""), 10) * (token.toLowerCase().includes("k") ? 1000 : 1);

const checkSalaryRange = (jobSalary, filterSalary) => {
  if (!jobSalary || !filterSalary) return true;
  const tokens = jobSalary.match(/\$(\d+)k?/gi);
  if (!tokens) return true;

  if (filterSalary === "under-50k") return dollarsToNumber(tokens[0]) < 50000;
  if (filterSalary === "200k+") return dollarsToNumber(tokens[tokens.length - 1]) >= 200000;

  const jobMin = dollarsToNumber(tokens[0]);
  const jobMax = tokens.length > 1 ? dollarsToNumber(tokens[1]) : jobMin;
  const parts = filterSalary.split("-");
  if (parts.length === 2) {
    return jobMin >= parseInt(parts[0], 10) * 1000 && jobMax <= parseInt(parts[1], 10) * 1000;
  }
  return true;
};

const jobText = (job) =>
  `${job.title || ""} ${job.requirements || ""} ${job.skills || ""} ${job.description || ""}`.toLowerCase();

/** How many published jobs mention each category's keywords. */
export const countByCategory = (jobs) => {
  const counts = {};
  CATEGORIES.forEach((category) => {
    counts[category.id] = jobs.filter((job) => {
      const text = jobText(job);
      return category.keywords.some((keyword) => text.includes(keyword));
    }).length;
  });
  return counts;
};

export const filterJobs = (jobs, { search, location, category, type, experience, salary }) =>
  jobs.filter((job) => {
    const query = search.toLowerCase();
    const matchesSearch = !search || jobText(job).includes(query) || (job.company || "").toLowerCase().includes(query);
    const matchesLocation = !location || (job.location || "").toLowerCase().includes(location.toLowerCase());
    const matchesCategory = !category || (job.category || "").toLowerCase().includes(category.toLowerCase()) || jobText(job).includes(category.toLowerCase());
    const matchesType = !type || (job.type || "").toLowerCase() === type.toLowerCase();
    const matchesExperience = !experience || job.experience === experience;
    const matchesSalary = !salary || checkSalaryRange(job.salary, salary);
    return matchesSearch && matchesLocation && matchesCategory && matchesType && matchesExperience && matchesSalary;
  });

const topSalary = (salary) => {
  const tokens = (salary || "").match(/\$(\d+)/g);
  if (!tokens) return 0;
  return parseInt(tokens[tokens.length - 1].replace(/\$/g, ""), 10) * (salary.includes("k") ? 1000 : 1);
};

export const sortJobs = (jobs, sortBy) => {
  const list = [...jobs];
  if (sortBy === "salary-desc") return list.sort((a, b) => topSalary(b.salary) - topSalary(a.salary));
  if (sortBy === "title-asc") return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  const time = (job) => new Date(job.createdAt || job.posted || 0).getTime();
  return list.sort((a, b) => time(b) - time(a));
};
