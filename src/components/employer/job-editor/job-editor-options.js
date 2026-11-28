// Option values sent to the API (never translated); labels come from common:enums or employer:jobEditor.
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];

export const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead", "Manager"];

export const STATUS_OPTIONS = ["active", "Published", "Draft", "Closed"];

// Hint shown under each status card, keyed by status value -> employer:jobEditor.statusHint.<key>
export const STATUS_HINT_KEY = {
  active: "live",
  Published: "live",
  Draft: "internal",
  Closed: "archived",
};
