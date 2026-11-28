import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobs } from "../../../context/JobContext";
import { companyService } from "../../../services/companyService";
import { countByCategory, filterJobs, sortJobs } from "./home-job-filtering";

const FILTER_KEYS = ["search", "location", "category", "type", "experience", "salary"];

/**
 * All state of the home job browser: URL-backed filters, sort order, filtered jobs,
 * category counts and the companies currently hiring. The URL stays the source of truth
 * (?search=&location=&category=&type=&experience=&salary=), exactly as before.
 */
const useHomeJobsBrowser = () => {
  const { getPublishedJobs, loading, error, fetchJobs } = useJobs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("newest");
  const [companies, setCompanies] = useState([]);

  const filters = {
    search: searchParams.get("search") || searchParams.get("q") || "",
    location: searchParams.get("location") || "",
    category: searchParams.get("category") || "",
    type: searchParams.get("type") || "",
    experience: searchParams.get("experience") || "",
    salary: searchParams.get("salary") || "",
  };
  const hasActiveFilters = FILTER_KEYS.some((key) => Boolean(filters[key]));

  useEffect(() => {
    let active = true;
    companyService
      .getAll({ limit: 100 })
      .then((response) => {
        if (active) setCompanies(response.data || []);
      })
      .catch(() => {
        if (active) setCompanies([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const publishedJobs = getPublishedJobs();
  const categoryCounts = useMemo(() => countByCategory(publishedJobs), [publishedJobs]);
  const { search, location, category, type, experience, salary } = filters;
  const sortedJobs = useMemo(
    () => sortJobs(filterJobs(publishedJobs, { search, location, category, type, experience, salary }), sortBy),
    [publishedJobs, search, location, category, type, experience, salary, sortBy]
  );

  const companyByName = useMemo(
    () => new Map(companies.map((company) => [company.name.toLowerCase(), company])),
    [companies]
  );

  // Organisations present in the current listings (counts are scoped to the loaded jobs).
  const hiringOrganizations = useMemo(() => {
    const organizations = new Map();
    publishedJobs.forEach((job) => {
      if (!job.company || organizations.has(job.company)) return;
      const profile = companyByName.get(job.company.toLowerCase());
      organizations.set(job.company, {
        ...(profile || {}),
        name: job.company,
        jobId: job.id,
        location: profile?.location || job.location,
        rolesInCurrentListings: publishedJobs.filter((item) => item.company === job.company).length,
      });
    });
    return Array.from(organizations.values()).slice(0, 6);
  }, [publishedJobs, companyByName]);

  /** Set (or clear when empty) one or several query params at once. */
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  const toggleCategory = (slug) => updateParams({ category: category === slug ? "" : slug });
  const clearAllFilters = () => setSearchParams(new URLSearchParams());

  return {
    loading,
    error,
    fetchJobs,
    filters,
    hasActiveFilters,
    sortBy,
    setSortBy,
    publishedJobs,
    sortedJobs,
    categoryCounts,
    companyByName,
    hiringOrganizations,
    updateParams,
    toggleCategory,
    clearAllFilters,
  };
};

export default useHomeJobsBrowser;
