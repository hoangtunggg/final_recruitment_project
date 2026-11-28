import { useTranslation } from "react-i18next";
import { cx } from "../ui";
import { maxTurnsFor } from "./interview-constants";

/**
 * Top row of the chat: the "End and see results" button, one bar per TOPIC (a topic can take several turns:
 * follow-ups, hints, clarifications) and the "Topic i/n - question k/cap" counter.
 * progress = { index, total, turnNumber } or null before the plan arrives.
 */
const InterviewProgressBar = ({ progress, durationMinutes, onEnd }) => {
  const { t } = useTranslation("interview");
  const total = progress?.total ?? 0;
  const index = progress?.index ?? 0;
  const cap = maxTurnsFor(durationMinutes);
  const counter = progress
    ? progress.turnNumber
      ? t("question.progressWithTurn", { index, total, turn: progress.turnNumber, cap })
      : t("question.progress", { index, total })
    : "";

  return (
    <div className="flex items-center justify-between gap-4 sm:gap-10">
      <button
        type="button"
        data-testid="interview-end"
        onClick={onEnd}
        className="min-h-11 cursor-pointer whitespace-nowrap rounded-pill border border-brand-red bg-brand-red/5 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-brand-red/10"
      >
        {t("question.end")}
      </button>
      <div
        role="progressbar"
        aria-label={t("question.progressLabel")}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
        className="flex max-w-[60%] flex-1 gap-2.5 px-2.5 py-2"
      >
        {Array.from({ length: total }, (_, position) => (
          <span
            key={position}
            className={cx(
              "h-1.5 flex-1 rounded-full",
              position < index ? "bg-primary-500/45" : "bg-primary-500/15"
            )}
          />
        ))}
      </div>
      <span data-testid="interview-progress-count" className="min-w-16 whitespace-nowrap text-right text-sm">
        {counter}
      </span>
    </div>
  );
};

export default InterviewProgressBar;
