// Pipeline stages in display order (values are the API enum; labels come from common:enums.applicationStatus).
export const APPLICATION_STATUSES = [
  "pending",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
];

/** Two-letter avatar initials from an applicant name ("AP" when unknown). */
export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "AP";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

/** Skills may arrive as an array or a comma separated string. */
export const toSkillList = (skills) =>
  (Array.isArray(skills) ? skills : String(skills || "").split(","))
    .map((s) => (typeof s === "string" ? s.trim() : s))
    .filter(Boolean);
