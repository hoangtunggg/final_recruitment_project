// Small pure formatting helpers shared by the interview screens.

/** 125 -> "02:05" (countdown, recording time). */
export const formatClock = (totalSeconds) => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

/** Number for display ("7,5" in vi-VN); "–" when the API did not provide a value. */
export const formatNumber = (value, locale, maxFractionDigits = 1) =>
  value == null ? "–" : Number(value).toLocaleString(locale, { maximumFractionDigits: maxFractionDigits });

/** Up to two initials of a person's name for the avatar ("Nguyễn Văn A" -> "NA"). */
export const initialsOf = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const letters = parts.length === 1 ? [parts[0]] : [parts[0], parts[parts.length - 1]];
  return letters.map((part) => part[0]).join("").toUpperCase();
};

/** Links in AI-written study plans: only http(s) is clickable (blocks "javascript:" and friends). */
export const safeHttpUrl = (url) => {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol) ? url : "";
  } catch {
    return "";
  }
};

/** Whole seconds since the interview started. */
export const elapsedSeconds = (startedAt) => Math.round((Date.now() - startedAt) / 1000);

/** Title of a topic id inside the interview plan ({phases: [{topics: [{id, title}]}]}). "" when unknown. */
export const findTopicTitle = (topicId, plan) => {
  for (const phase of plan?.phases || []) {
    for (const topic of phase.topics || []) if (topic.id === topicId) return topic.title;
  }
  return "";
};
