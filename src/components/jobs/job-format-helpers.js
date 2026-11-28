/**
 * Small helpers shared by every candidate-facing job view (cards, detail page, dashboard lists).
 * Nothing here changes data sent to / received from the API: only how it is displayed.
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Relative time ("5 phút trước" / "5m ago"), re-renders when the language changes. */
export const useTimeAgo = () => {
  const { t } = useTranslation("public");
  return useCallback(
    (dateString) => {
      if (!dateString) return t("time.recently");
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return t("time.recently");

      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 60) return t("time.justNow");
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return t("time.minutesAgo", { n: minutes });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t("time.hoursAgo", { n: hours });
      const days = Math.floor(hours / 24);
      if (days < 30) return t("time.daysAgo", { n: days });
      return t("time.monthsAgo", { n: Math.floor(days / 30) });
    },
    [t]
  );
};

/** Badge tone for a job type (values stay the API values: Full-time, Remote, ...). */
export const jobTypeTone = (type) => {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("remote")) return "success";
  if (normalized.includes("part-time")) return "warning";
  if (normalized.includes("contract") || normalized.includes("temporary")) return "info";
  if (normalized.includes("internship")) return "info";
  return "primary";
};

/** Split a free-text field (one item per line, `;` or `,`) into trimmed list items. */
export const splitListItems = (text) => {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  let items;
  if (trimmed.includes("\n")) items = trimmed.split("\n");
  else if (trimmed.includes(";")) items = trimmed.split(";");
  else if (trimmed.includes(",")) items = trimmed.split(",");
  else items = [trimmed];

  return items.map((item) => item.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
};

/** Comma separated skills string -> ["React", "Node.js"]. */
export const splitSkills = (skills) =>
  typeof skills === "string"
    ? skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];
