/**
 * Pure derivations for the candidate dashboard (no React, no translation):
 * profile skills, saved jobs resolved against live listings, skill-ranked recommendations, KPI counters.
 */

/**
 * Profile `skills` may be an array, a JSON string or "a, b, c" -> trimmed list
 * (lowercase for matching; pass `{ lowerCase: false }` to keep the display casing).
 */
export const parseCandidateSkills = (skills, { lowerCase = true } = {}) => {
  if (!skills) return [];
  const clean = (list) =>
    list.map((item) => (lowerCase ? String(item).toLowerCase() : String(item)).trim()).filter(Boolean);
  if (Array.isArray(skills)) return clean(skills);
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) return clean(parsed);
    if (typeof parsed === "string") return clean(parsed.split(","));
  } catch {
    if (typeof skills === "string") return clean(skills.split(","));
  }
  return [];
};

/** Saved bookmarks + whether the listing is still published. */
export const resolveSavedJobs = (savedJobs, publishedJobs) => {
  if (!Array.isArray(savedJobs)) return [];
  return savedJobs.map((saved) => {
    const live = publishedJobs.find((job) => job.id === saved.id);
    return { ...(live || saved), savedAt: saved.savedAt, isAvailable: Boolean(live) };
  });
};

const postedTime = (job) => new Date(job.createdAt || job.posted || 0).getTime();

/** Published jobs ranked by matching profile skills, then by newest. */
export const rankRecommendedJobs = (publishedJobs, candidateSkills) => {
  if (!publishedJobs || publishedJobs.length === 0) return [];
  return publishedJobs
    .map((job) => {
      const haystack = `${job.skills || ""} ${job.title || ""} ${job.description || ""}`.toLowerCase();
      const matchedSkills = candidateSkills.filter((skill) => skill && haystack.includes(skill));
      return { ...job, matchedSkills, score: matchedSkills.length };
    })
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : postedTime(b) - postedTime(a)));
};

/** KPI counters shown in the dashboard header cards. */
export const computeApplicationStats = (applications, savedCount) =>
  applications.reduce(
    (acc, app) => {
      acc.total++;
      acc.applied++;
      if (app.status === "under_review" || app.status === "viewed") acc.viewed++;
      else if (app.status === "shortlisted") acc.shortlisted++;
      else if (app.status === "offered" || app.status === "accepted") acc.offers++;
      else if (app.status === "interview_scheduled" || app.status === "interviewed") acc.interviews++;
      else if (app.status === "rejected") acc.rejected++;
      return acc;
    },
    { total: 0, applied: 0, viewed: 0, shortlisted: 0, interviews: 0, offers: 0, rejected: 0, saved: savedCount }
  );
