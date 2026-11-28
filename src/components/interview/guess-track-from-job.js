// Suggests the interview track for a job posting (the candidate can change it). Title wins over skills so
// "Python Backend Developer" is python_backend even when the skills also list Docker.
const RULES = [
  ["python_backend", /python|django|fastapi|flask/],
  ["nodejs_backend", /node\.?js|nodejs|express|nestjs/],
  ["java_backend", /\bjava\b(?!\s*script)|spring/],
  ["frontend_react", /react|frontend|front-end|front end|vue|angular|next\.?js/],
  ["devops_engineer", /devops|kubernetes|\bk8s\b|\bsre\b|ci\/cd|terraform/],
  ["ai_engineer", /\bai\b|machine learning|\bml\b|\bllm\b|data scientist|deep learning/],
];

const firstMatch = (text) => {
  const lower = String(text || "").toLowerCase();
  return RULES.find(([, pattern]) => pattern.test(lower))?.[0] ?? "";
};

/** @returns {string} a track id, or "" when nothing matches */
export const guessTrackFromJob = (job) => firstMatch(job?.title) || firstMatch(job?.skills);
