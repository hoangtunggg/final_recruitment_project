import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useHomeJobsBrowser from "./home/useHomeJobsBrowser";
import HomeHero from "./home/HomeHero";
import HomeBrowseSection from "./home/HomeBrowseSection";
import HomeInterviewPromo from "./home/HomeInterviewPromo";
import HomeCategories from "./home/HomeCategories";
import HomeCompanies from "./home/HomeCompanies";
import HomeHowItWorks from "./home/HomeHowItWorks";
import HomeFinalCta from "./home/HomeFinalCta";

const scrollToId = (...ids) => {
  const target = ids.map((id) => document.getElementById(id)).find(Boolean);
  if (target) target.scrollIntoView({ behavior: "smooth" });
};

const dashboardPathFor = (role) => {
  if (role === "employer") return "/employer/post-job";
  if (role === "admin") return "/admin";
  return "/dashboard";
};

/**
 * Public landing page: hero search, job browser, AI-interview promo, categories,
 * hiring companies, how it works and a closing call to action.
 * Data and filter state live in useHomeJobsBrowser; each section is its own component.
 */
const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { hash } = useLocation();
  const browser = useHomeJobsBrowser();
  const { filters, publishedJobs, loading, categoryCounts, hiringOrganizations, updateParams, toggleCategory } = browser;

  const scrollToBrowse = () => scrollToId("browse-jobs", "featured-jobs");

  // /#browse-jobs, /#featured-jobs and /#categories scroll to their section after render.
  useEffect(() => {
    const current = hash || window.location.hash;
    if (!["#browse-jobs", "#featured-jobs", "#categories"].includes(current)) return undefined;
    const timer = setTimeout(
      () => (current === "#categories" ? scrollToId("categories", "featured-jobs") : scrollToId("browse-jobs", "featured-jobs")),
      120
    );
    return () => clearTimeout(timer);
  }, [hash]);

  const handleSearch = ({ search, location }) => {
    updateParams({ search, location });
    scrollToBrowse();
  };
  const handleQuickTag = (tag) => {
    updateParams({ [tag.type]: tag.value });
    scrollToBrowse();
  };
  const handleCategory = (slug) => {
    toggleCategory(slug);
    scrollToBrowse();
  };

  return (
    <div className="bg-canvas text-ink">
      <HomeHero
        key={`${filters.search}|${filters.location}`}
        initialSearch={filters.search}
        initialLocation={filters.location}
        openJobs={publishedJobs.length}
        loading={loading}
        onSearch={handleSearch}
        onQuickTag={handleQuickTag}
      />
      <HomeBrowseSection browser={browser} />
      <HomeInterviewPromo />
      <HomeCategories counts={categoryCounts} selected={filters.category} onToggle={handleCategory} />
      <HomeCompanies organizations={hiringOrganizations} onBrowse={scrollToBrowse} />
      <HomeHowItWorks
        postJobPath={isAuthenticated && user?.role === "employer" ? "/employer/post-job" : "/register"}
        onBrowse={scrollToBrowse}
      />
      <HomeFinalCta
        isAuthenticated={isAuthenticated}
        dashboardPath={dashboardPathFor(user?.role)}
        onBrowse={scrollToBrowse}
      />
    </div>
  );
};

export default HomePage;
