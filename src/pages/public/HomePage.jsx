import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaBriefcase,
  FaArrowRight,
  FaBuilding,
  FaShieldAlt,
  FaUserCheck,
  FaClock,
  FaLaptopCode,
  FaPaintBrush,
  FaChartLine,
  FaHandshake,
  FaMoneyBillWave,
  FaHospitalUser,
  FaHeadset,
  FaCogs,
  FaRedo,
  FaFilter,
  FaTimes,
  FaSortAmountDown,
} from "react-icons/fa";
import { useJobs } from "../../context/JobContext";
import useAuth from "../../hooks/useAuth";
import JobCard from "../../components/jobs/JobCard";
import JobSkeleton from "../../components/jobs/JobSkeleton";

const CATEGORIES_CONFIG = [
  {
    id: "software",
    name: "Software & Tech",
    slug: "Software",
    keywords: ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "python", "tech", "web"],
    icon: FaLaptopCode,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  },
  {
    id: "design",
    name: "Product & Design",
    slug: "Design",
    keywords: ["design", "ui", "ux", "product design", "figma", "graphic", "creative"],
    icon: FaPaintBrush,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  },
  {
    id: "marketing",
    name: "Marketing & Growth",
    slug: "Marketing",
    keywords: ["marketing", "seo", "content", "growth", "social media", "brand", "digital"],
    icon: FaChartLine,
    color: "text-pink-600 bg-pink-50 dark:bg-pink-950/50 dark:text-pink-400",
  },
  {
    id: "sales",
    name: "Sales & Business",
    slug: "Sales",
    keywords: ["sales", "account", "business development", "b2b", "revenue"],
    icon: FaHandshake,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    slug: "Finance",
    keywords: ["finance", "accounting", "auditor", "analyst", "financial", "tax"],
    icon: FaMoneyBillWave,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  },
  {
    id: "healthcare",
    name: "Healthcare & Science",
    slug: "Healthcare",
    keywords: ["health", "nurse", "medical", "doctor", "clinical", "hospital", "pharma"],
    icon: FaHospitalUser,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400",
  },
  {
    id: "support",
    name: "Customer Support",
    slug: "Support",
    keywords: ["support", "customer service", "help desk", "client success", "representative"],
    icon: FaHeadset,
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400",
  },
  {
    id: "operations",
    name: "Operations & HR",
    slug: "Operations",
    keywords: ["operation", "operations", "hr", "human resources", "recruiter", "logistics", "management"],
    icon: FaCogs,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400",
  },
];

const QUICK_TAGS = [
  { label: "Remote", type: "type", value: "Remote" },
  { label: "Full-time", type: "type", value: "Full-time" },
  { label: "Engineering", type: "category", value: "Software" },
  { label: "Design", type: "category", value: "Design" },
  { label: "Marketing", type: "category", value: "Marketing" },
];

const HomePage = () => {
  const { getPublishedJobs, loading, error, fetchJobs } = useJobs();
  const { isAuthenticated, user } = useAuth();
  const locationState = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter criteria from searchParams
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";
  const typeFilter = searchParams.get("type") || "";
  const experienceFilter = searchParams.get("experience") || "";
  const salaryFilter = searchParams.get("salary") || "";

  // Hero search bar input state
  const [keywordInput, setKeywordInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);
  const [sortBy, setSortBy] = useState("newest");

  // Keep search bar inputs synced with URL search params
  useEffect(() => {
    setKeywordInput(search);
  }, [search]);

  useEffect(() => {
    setLocationInput(location);
  }, [location]);

  const publishedJobs = getPublishedJobs();

  const scrollToBrowseJobs = () => {
    const target =
      document.getElementById("browse-jobs") ||
      document.getElementById("featured-jobs");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-scroll to browse jobs section if requested via hash
  useEffect(() => {
    const hash = locationState.hash || window.location.hash;
    if (
      hash === "#browse-jobs" ||
      hash === "#featured-jobs" ||
      hash === "#categories"
    ) {
      const targetId = hash === "#categories" ? "categories" : "browse-jobs";
      const target =
        document.getElementById(targetId) ||
        document.getElementById("featured-jobs");
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 120);
      }
    }
  }, [locationState.hash]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (keywordInput.trim()) next.set("search", keywordInput.trim());
    else next.delete("search");

    if (locationInput.trim()) next.set("location", locationInput.trim());
    else next.delete("location");

    setSearchParams(next);
    scrollToBrowseJobs();
  };

  const handleQuickTagClick = (tag) => {
    const next = new URLSearchParams(searchParams);
    next.set(tag.type, tag.value);
    setSearchParams(next);
    scrollToBrowseJobs();
  };

  const handleCategoryClick = (categorySlug) => {
    const next = new URLSearchParams(searchParams);
    if (category === categorySlug) {
      next.delete("category");
    } else {
      next.set("category", categorySlug);
    }
    setSearchParams(next);
    scrollToBrowseJobs();
  };

  const clearAllFilters = () => {
    setKeywordInput("");
    setLocationInput("");
    setSearchParams(new URLSearchParams());
  };

  // Salary range parser
  const checkSalaryRange = (jobSalary, filterSalary) => {
    if (!jobSalary || !filterSalary) return true;

    if (filterSalary === "under-50k") {
      const match = jobSalary.match(/\$(\d+)k?/i);
      if (!match) return true;
      const num = parseInt(match[1]) * (match[0].toLowerCase().includes("k") ? 1000 : 1);
      return num < 50000;
    }
    if (filterSalary === "200k+") {
      const matches = jobSalary.match(/\$(\d+)k?/gi);
      if (!matches) return true;
      const last = matches[matches.length - 1];
      const num = parseInt(last.replace(/[$kK]/g, "")) * (last.toLowerCase().includes("k") ? 1000 : 1);
      return num >= 200000;
    }

    const jobSalaryMatch = jobSalary.match(/\$(\d+)k?/gi);
    if (!jobSalaryMatch) return true;

    const jobMin =
      parseInt(jobSalaryMatch[0].replace(/[$kK]/g, "")) *
      (jobSalaryMatch[0].toLowerCase().includes("k") ? 1000 : 1);
    const jobMax =
      jobSalaryMatch.length > 1
        ? parseInt(jobSalaryMatch[1].replace(/[$kK]/g, "")) *
          (jobSalaryMatch[1].toLowerCase().includes("k") ? 1000 : 1)
        : jobMin;

    const parts = filterSalary.split("-");
    if (parts.length === 2) {
      const filterMin = parseInt(parts[0]) * 1000;
      const filterMax = parseInt(parts[1]) * 1000;
      return jobMin >= filterMin && jobMax <= filterMax;
    }

    return true;
  };

  // Calculate real category counts from actual active jobs once per jobs list change
  const categoryCounts = useMemo(() => {
    if (!publishedJobs || publishedJobs.length === 0) return {};
    const counts = {};
    CATEGORIES_CONFIG.forEach((cat) => {
      counts[cat.id] = publishedJobs.filter((job) => {
        const textToSearch = `${job.title || ""} ${job.requirements || ""} ${job.skills || ""} ${job.description || ""}`.toLowerCase();
        return cat.keywords.some((kw) => textToSearch.includes(kw));
      }).length;
    });
    return counts;
  }, [publishedJobs]);

  const getCategoryCount = (categoryKeywords, catId) => {
    if (catId && categoryCounts[catId] !== undefined) return categoryCounts[catId];
    if (Array.isArray(categoryKeywords)) {
      const found = CATEGORIES_CONFIG.find((c) => c.keywords === categoryKeywords);
      if (found && categoryCounts[found.id] !== undefined) return categoryCounts[found.id];
      if (!publishedJobs || publishedJobs.length === 0) return 0;
      return publishedJobs.filter((job) => {
        const textToSearch = `${job.title || ""} ${job.requirements || ""} ${job.skills || ""} ${job.description || ""}`.toLowerCase();
        return categoryKeywords.some((kw) => textToSearch.includes(kw));
      }).length;
    }
    return 0;
  };

  // Filter jobs based on active criteria
  const filteredJobs = useMemo(() => {
    return publishedJobs.filter((job) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        (job.title && job.title.toLowerCase().includes(query)) ||
        (job.company && job.company.toLowerCase().includes(query)) ||
        (job.requirements && job.requirements.toLowerCase().includes(query)) ||
        (job.skills && job.skills.toLowerCase().includes(query)) ||
        (job.description && job.description.toLowerCase().includes(query));

      const matchesLocation =
        !location ||
        (job.location &&
          job.location.toLowerCase().includes(location.toLowerCase()));

      const matchesCategory =
        !category ||
        (job.category && job.category.toLowerCase().includes(category.toLowerCase())) ||
        (job.title && job.title.toLowerCase().includes(category.toLowerCase())) ||
        (job.requirements && job.requirements.toLowerCase().includes(category.toLowerCase())) ||
        (job.skills && job.skills.toLowerCase().includes(category.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(category.toLowerCase()));

      const matchesType =
        !typeFilter ||
        (job.type && job.type.toLowerCase() === typeFilter.toLowerCase());

      const matchesExperience =
        !experienceFilter || job.experience === experienceFilter;

      const matchesSalary =
        !salaryFilter || checkSalaryRange(job.salary, salaryFilter);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesType &&
        matchesExperience &&
        matchesSalary
      );
    });
  }, [
    publishedJobs,
    search,
    location,
    category,
    typeFilter,
    experienceFilter,
    salaryFilter,
  ]);

  // Sort filtered jobs
  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortBy === "salary-desc") {
      const getSalaryNum = (s) => {
        if (!s) return 0;
        const matches = s.match(/\$(\d+)/g);
        if (!matches) return 0;
        return (
          parseInt(matches[matches.length - 1].replace(/\$/g, "")) *
          (s.includes("k") ? 1000 : 1)
        );
      };
      return list.sort((a, b) => getSalaryNum(b.salary) - getSalaryNum(a.salary));
    }
    if (sortBy === "title-asc") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    // Default newest
    return list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.posted || 0).getTime();
      const dateB = new Date(b.createdAt || b.posted || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredJobs, sortBy]);

  const hasActiveFilters = Boolean(
    search ||
      location ||
      category ||
      typeFilter ||
      experienceFilter ||
      salaryFilter
  );

  // Presentation-only grouping from the already loaded job collection.
  // Counts are explicitly scoped to the current listings, not platform totals.
  const hiringOrganizations = useMemo(() => {
    const organizations = new Map();
    publishedJobs.forEach((job) => {
      if (!job.company || organizations.has(job.company)) return;
      organizations.set(job.company, {
        name: job.company,
        jobId: job.id,
        location: job.location,
        rolesInCurrentListings: publishedJobs.filter(
          (item) => item.company === job.company
        ).length,
      });
    });
    return Array.from(organizations.values()).slice(0, 5);
  }, [publishedJobs]);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="bg-slate-100 dark:bg-gray-900 py-4 sm:py-6 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Live Availability Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 mb-3 border border-blue-200 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              {loading
                ? "Connecting to live job registry..."
                : publishedJobs.length > 0
                ? `${publishedJobs.length} verified position${publishedJobs.length === 1 ? "" : "s"} open right now`
                : "Real-time verified recruitment platform"}
            </div>

            {/* Primary Headline */}
            <h1 className="text-[30px] sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-2">
              Find the right opportunity for{" "}
              <span className="text-blue-700 dark:text-blue-300">
                your next career move
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base text-slate-600 dark:text-gray-300 mb-4 leading-relaxed max-w-2xl mx-auto">
              Search verified openings by role, company, location, and working style.
            </p>

            {/* Functional Search Bar */}
            <form
              onSubmit={handleHeroSearchSubmit}
              className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-slate-300 dark:border-gray-600"
            >
              <div className="flex flex-col md:flex-row gap-2">
                {/* Keywords input */}
                <div className="flex-[1.35] flex items-center min-h-12 px-4 bg-white dark:bg-gray-700 rounded-lg border border-slate-300 dark:border-gray-600 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-500/30 transition-colors">
                  <FaSearch className="text-gray-400 text-base mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Job title, skills, or company"
                    className="w-full bg-transparent outline-none text-base text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-300 border-none p-0 focus:ring-0"
                    aria-label="Job title or keywords"
                  />
                </div>

                {/* Location input */}
                <div className="flex-1 flex items-center min-h-12 px-4 bg-white dark:bg-gray-700 rounded-lg border border-slate-300 dark:border-gray-600 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-500/30 transition-colors">
                  <FaMapMarkerAlt className="text-gray-400 text-base mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Location or 'Remote'"
                    className="w-full bg-transparent outline-none text-base text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-300 border-none p-0 focus:ring-0"
                    aria-label="Job location"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center px-7 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 cursor-pointer"
                >
                  <FaSearch className="mr-2 text-xs" />
                  Search Jobs
                </button>
              </div>

              {/* Quick Search Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-gray-700 px-1 text-sm text-slate-600 dark:text-gray-300">
                <span className="font-medium mr-1">Popular:</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] gap-4 mt-4 text-left">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-3 lg:h-[304px]">
                <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-200 dark:border-gray-700">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Explore job categories</h2>
                  <Link to="/#categories" className="text-xs font-semibold text-blue-700 dark:text-blue-300">View all</Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                  {CATEGORIES_CONFIG.slice(0, 6).map((cat) => {
                    const Icon = cat.icon;
                    const count = getCategoryCount(cat.keywords, cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="group flex min-h-10 items-center justify-between gap-1.5 rounded-lg px-1.5 text-left text-[13px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 lg:gap-3 lg:px-2.5 lg:text-sm"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                            <Icon aria-hidden="true" />
                          </span>
                          <span className="truncate" title={cat.name}>{cat.name}</span>
                        </span>
                        <span className="text-xs tabular-nums text-slate-500 dark:text-gray-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-blue-800 bg-blue-900 dark:bg-blue-950 text-white p-4 sm:p-6 lg:h-[304px]">
                <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full border-[36px] border-blue-700/40" aria-hidden="true" />
                <div className="absolute right-10 -bottom-24 w-72 h-72 rounded-full border-[48px] border-cyan-400/10" aria-hidden="true" />
                <div className="relative grid md:grid-cols-[0.9fr_1.1fr] gap-6 h-full items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
                      <FaShieldAlt aria-hidden="true" /> Verified recruitment
                    </span>
                    <h2 className="text-xl sm:text-3xl font-bold mt-2 leading-tight">Build your shortlist from active roles</h2>
                    <p className="text-sm text-blue-100 mt-3 max-w-md leading-relaxed">
                      Review real openings, compare role details, and continue through the existing application workflow.
                    </p>
                    <button
                      type="button"
                      onClick={scrollToBrowseJobs}
                      className="mt-4 sm:mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Browse current openings <FaArrowRight aria-hidden="true" />
                    </button>
                  </div>
                  <div className="hidden space-y-2 md:block">
                    {publishedJobs.slice(0, 3).map((job) => (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="block rounded-lg border border-white/20 bg-white/10 p-3 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{job.title}</p>
                            <p className="text-xs text-blue-100 mt-0.5 truncate">{job.company} · {job.location || "Remote"}</p>
                          </div>
                          <FaArrowRight className="mt-1 shrink-0 text-blue-200" aria-hidden="true" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. UNIFIED BROWSE JOBS SECTION (Home + Browse on ONE page) */}
      <section
        id="browse-jobs"
        className="py-8 bg-slate-50 dark:bg-gray-900 scroll-mt-20 border-b border-slate-200 dark:border-gray-800"
      >
        <div id="featured-jobs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                <FaBriefcase className="text-xs" />
                <span>Current Opportunities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Browse open positions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Explore active roles from verified employers. Filter by type, experience, and salary right here.
              </p>
            </div>

            {/* Total count badge */}
            <div className="text-sm text-slate-600 dark:text-gray-300 font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{sortedJobs.length}</span> of {publishedJobs.length} positions
            </div>
          </div>

          {/* Integrated Filter Toolbar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-300 dark:border-gray-600 mb-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Filter controls */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                <div className="col-span-2 flex items-center text-xs font-bold text-slate-600 dark:text-gray-300 uppercase tracking-wider">
                  <FaFilter className="mr-1.5 text-blue-600 text-xs" />
                  <span>Filters:</span>
                </div>

                {/* Job Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => updateParam("type", e.target.value)}
                  className="min-w-0 w-full sm:w-auto min-h-11 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-sm font-medium text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Filter by Job Type"
                >
                  <option value="">Job type: all</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>

                {/* Experience Filter */}
                <select
                  value={experienceFilter}
                  onChange={(e) => updateParam("experience", e.target.value)}
                  className="min-w-0 w-full sm:w-auto min-h-11 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-sm font-medium text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Filter by Experience Level"
                >
                  <option value="">Experience: all</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                </select>

                {/* Salary Filter */}
                <select
                  value={salaryFilter}
                  onChange={(e) => updateParam("salary", e.target.value)}
                  className="min-w-0 w-full sm:w-auto min-h-11 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-sm font-medium text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Filter by Salary Range"
                >
                  <option value="">Salary: all</option>
                  <option value="under-50k">Under $50k</option>
                  <option value="50-80">$50k - $80k</option>
                  <option value="80-120">$80k - $120k</option>
                  <option value="120-150">$120k - $150k</option>
                  <option value="150-200">$150k - $200k</option>
                  <option value="200k+">$200k+</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <FaSortAmountDown className="text-gray-400 text-xs" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-h-11 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-sm font-medium text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Sort positions"
                >
                  <option value="newest">Newest First</option>
                  <option value="salary-desc">Highest Salary</option>
                  <option value="title-asc">Role Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Active filter badges row */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Active filters:
                </span>

                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Keyword: "{search}"
                    <button
                      type="button"
                      onClick={() => updateParam("search", "")}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {location && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Location: "{location}"
                    <button
                      type="button"
                      onClick={() => updateParam("location", "")}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {category && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Category: {category}
                    <button
                      type="button"
                      onClick={() => updateParam("category", "")}
                      className="hover:text-indigo-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {typeFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Type: {typeFilter}
                    <button
                      type="button"
                      onClick={() => updateParam("type", "")}
                      className="hover:text-emerald-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {experienceFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Exp: {experienceFilter}
                    <button
                      type="button"
                      onClick={() => updateParam("experience", "")}
                      className="hover:text-purple-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {salaryFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Salary: {salaryFilter}
                    <button
                      type="button"
                      onClick={() => updateParam("salary", "")}
                      className="hover:text-amber-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Jobs Listing Grid / Skeletons / Empty / Error State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 max-w-lg mx-auto shadow-sm">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchJobs}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                <FaRedo className="text-xs" />
                <span>Retry loading jobs</span>
              </button>
            </div>
          ) : sortedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <FaBriefcase className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {hasActiveFilters
                  ? "No positions match your selected filters"
                  : "No active job postings right now"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search criteria, keywords, or clearing your active filters."
                  : "Be among the first employers to reach qualified candidates, or check back soon for fresh openings."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                ) : (
                  <Link
                    to={isAuthenticated && user?.role === "employer" ? "/employer/post-job" : "/register"}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
                  >
                    Post a Position
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. TARGETED DISCOVERY (Categories with real counts & interactive filter) */}
      <section id="categories" className="py-8 bg-white dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Targeted Discovery
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Explore Roles by Category
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Filter jobs matching your functional area of expertise with one click.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES_CONFIG.map((cat) => {
              const count = getCategoryCount(cat.keywords);
              const Icon = cat.icon;
              const isSelected = category.toLowerCase() === cat.slug.toLowerCase();

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`text-left group p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border transition-colors flex flex-col justify-between cursor-pointer min-h-44 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                    isSelected
                      ? "border-blue-700 ring-2 ring-blue-500/20"
                      : "border-slate-300 dark:border-gray-600 hover:border-blue-600"
                  }`}
                >
                  <div>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${cat.color}`}
                    >
                      <Icon className="text-xl" />
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors mb-1">
                      {cat.name}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-gray-300">
                      {count > 0 ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {count} open role{count === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span>Explore category</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between text-sm font-medium text-slate-600 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    <span>{isSelected ? "Filter applied" : "View positions"}</span>
                    <FaArrowRight className="text-xs" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. EMPLOYER DISCOVERY FROM CURRENT LIVE LISTINGS */}
      {hiringOrganizations.length > 0 && (
        <section className="py-8 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Employer discovery
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  Organizations hiring now
                </h2>
                <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">
                  Companies represented in the current set of active listings.
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToBrowseJobs}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"
              >
                Browse all current jobs <FaArrowRight aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {hiringOrganizations.map((organization) => (
                <Link
                  key={organization.name}
                  to={`/jobs/${organization.jobId}`}
                  className="group min-w-0 rounded-xl border border-slate-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800 hover:border-blue-600 dark:hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-bold text-sm border border-blue-100 dark:border-blue-900">
                    {organization.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <h3 className="mt-3 text-sm font-bold leading-snug text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {organization.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-gray-400 truncate">
                    {organization.location || "Multiple locations"}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {organization.rolesInCurrentListings} role{organization.rolesInCurrentListings === 1 ? "" : "s"} in current listings
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. VALUE PROPOSITIONS & TRUST (Platform Pillars) */}
      <section className="py-8 bg-slate-50 dark:bg-gray-900 border-t border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                <FaShieldAlt className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Verified Openings
                </h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  Direct postings from vetted hiring teams and organizations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                <FaUserCheck className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Direct Application
                </h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  No middleman redirections; submit your resume straight to recruiters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
                <FaClock className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Real-Time Status
                </h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  Track when your resume is reviewed, shortlisted, or invited.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
                <FaBuilding className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Dedicated Dashboards
                </h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  Tailored workspaces for candidates, hiring managers, and admins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-8 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              How the Platform Works
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-300 mt-2">
              Designed to connect candidates and hiring managers with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* For Candidates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-5 sm:p-6">
              <div className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 mb-4">
                For Job Seekers
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Fast-track your job search
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Build Your Profile & Resume
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
                      Create an account, upload your credentials, and maintain your primary resume in one secure hub.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Filter by Skills & Modality
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
                      Search by remote preference, compensation range, and experience level with instant filter responses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Apply Directly & Monitor Progress
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
                      Submit applications with one click and track status updates through your candidate dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={scrollToBrowseJobs}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                >
                  <span>Start browsing openings</span>
                  <FaArrowRight className="text-xs" />
                </button>
              </div>
            </div>

            {/* For Employers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-300 dark:border-gray-600 p-5 sm:p-6">
              <div className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 mb-4">
                For Employers & Recruiters
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Hire talent efficiently
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Publish Vacancies
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
                      Define responsibilities, salary ranges, and specific skill requirements using structured postings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Screen Qualified Applicants
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
                      Access verified applicant profiles and inspect uploaded resumes within your employer portal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Manage Hiring Pipeline
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
                      Shortlist top candidates, schedule interviews, and issue hiring decisions directly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  to={isAuthenticated && user?.role === "employer" ? "/employer/post-job" : "/register"}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  <span>Post your opening today</span>
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="py-8 bg-blue-800 dark:bg-blue-950 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Ready to Take Your Next Career Step?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-6 max-w-xl mx-auto">
            Whether you are seeking your next challenge or hiring qualified professionals, start today on JobPortal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollToBrowseJobs}
              className="w-full sm:w-auto min-h-11 px-6 rounded-lg bg-white text-blue-800 hover:bg-blue-50 font-semibold text-sm transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Browse Open Positions
            </button>

            {isAuthenticated ? (
              <Link
                to={user?.role === "employer" ? "/employer/post-job" : user?.role === "admin" ? "/admin" : "/dashboard"}
                className="inline-flex min-h-11 items-center justify-center w-full sm:w-auto px-6 rounded-lg hover:bg-white/10 text-white font-semibold text-sm border border-white/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center justify-center w-full sm:w-auto px-6 rounded-lg hover:bg-white/10 text-white font-semibold text-sm border border-white/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
