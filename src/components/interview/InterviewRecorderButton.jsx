import { FiMic, FiSquare } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { cx } from "../ui";

/**
 * Big round mic button (Figma "recorder"). state: "idle" (press to record) | "recording" (press to stop and
 * send, red, pulsing rings) | "busy" (transcribing, breathing). The 100px hit area wraps the 48px core.
 */
const InterviewRecorderButton = ({ state, disabled, onClick }) => {
  const { t } = useTranslation("interview");
  const recording = state === "recording";
  return (
    <button
      type="button"
      data-testid="interview-mic-button"
      data-state={state}
      disabled={disabled}
      aria-pressed={recording}
      aria-label={recording ? t("rec.stopLabel") : t("rec.startLabel")}
      onClick={onClick}
      className="relative grid h-[100px] w-[100px] cursor-pointer place-items-center rounded-full disabled:cursor-default disabled:opacity-50"
    >
      {recording && (
        <>
          <span aria-hidden="true" className="absolute h-12 w-12 animate-ping rounded-full bg-brand-red/40" />
          <span
            aria-hidden="true"
            style={{ animationDelay: "0.8s" }}
            className="absolute h-12 w-12 animate-ping rounded-full bg-brand-red/30"
          />
        </>
      )}
      <span
        className={cx(
          "relative grid h-12 w-12 place-items-center rounded-full text-xl text-white",
          recording ? "bg-brand-red" : "bg-primary-600",
          state === "busy" && "animate-pulse"
        )}
      >
        {recording ? <FiSquare aria-hidden="true" className="h-4 w-4 fill-current" /> : <FiMic aria-hidden="true" />}
      </span>
    </button>
  );
};

export default InterviewRecorderButton;
