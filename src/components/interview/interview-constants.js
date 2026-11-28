// Fixed lists and limits of the AI interview page. Labels are NOT here: they live in the `interview`
// i18n namespace (tracks.<id>, levels.<id>) so every language gets natural wording.

/** Tracks accepted by ai-service (value sent to the API). */
export const TRACK_IDS = [
  "python_backend",
  "nodejs_backend",
  "java_backend",
  "frontend_react",
  "devops_engineer",
  "ai_engineer",
];

export const LEVEL_IDS = ["fresher", "junior", "middle", "senior"];
export const DEFAULT_LEVEL = "junior";

/** Allowed session lengths in minutes (ai-service accepts 15-45). */
export const DURATIONS = [15, 30, 45];
export const DEFAULT_DURATION = 15;

/** Blaze bills the whole recording: stop at 3 minutes (below the voice-service limit of 300 s). */
export const MAX_RECORDING_SECONDS = 180;

/** Turn cap of a session, same formula as ai-service app/time_budget.py (15 minutes -> 12 turns). */
export const maxTurnsFor = (minutes) => Math.max(8, Math.round((24 * minutes) / 30));

/** Roles allowed by interview-service. */
export const INTERVIEW_ROLES = ["jobseeker", "admin"];
