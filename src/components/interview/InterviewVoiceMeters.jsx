import { FiMic, FiMonitor } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { cx } from "../ui";

const BAR_HEIGHTS = ["h-[5px]", "h-2.5", "h-[15px]", "h-5"];

// 4 bars; the first `level` are lit. Colour is paired with the icon + text label, never colour alone.
const Meter = ({ icon, label, level, lit, testId }) => (
  <span className="flex items-center gap-2.5" title={label} data-testid={testId} data-level={level}>
    <span className="text-muted" aria-hidden="true">
      {icon}
    </span>
    <span className="sr-only">{label}</span>
    <span className="flex h-5 w-9 items-end gap-[3px]" aria-hidden="true">
      {BAR_HEIGHTS.map((height, position) => (
        <i key={position} className={cx("w-1.5 rounded-sm", height, position < level ? lit : "bg-line-strong")} />
      ))}
    </span>
  </span>
);

/** Fixed bottom-right gauges: microphone level and voice-service status (desktop only, decorative aid). */
const InterviewVoiceMeters = ({ voice }) => {
  const { t } = useTranslation("interview");
  return (
    <div
      role="group"
      aria-label={t("meters.label")}
      className="fixed bottom-7 right-10 z-[2] hidden flex-col items-end gap-5 lg:flex"
    >
      <Meter icon={<FiMic />} label={t("meters.mic")} level={voice.micLevel} lit="bg-brand-orange" testId="interview-meter-mic" />
      <Meter
        icon={<FiMonitor />}
        label={t("meters.service")}
        level={voice.serviceOk ? 4 : 0}
        lit="bg-brand-teal"
        testId="interview-meter-service"
      />
    </div>
  );
};

export default InterviewVoiceMeters;
