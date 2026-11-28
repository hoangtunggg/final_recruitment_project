import { useTranslation } from "react-i18next";
import useInterviewNumber from "../../../hooks/useInterviewNumber";
import ReportBlock from "./ReportBlock";
import { ReportList, ReportPanel } from "./report-parts";

const STAT_KEYS = ["thinking_time_s", "answer_duration_s", "speech_rate_spm", "filler_ratio"];

/** Speaking-delivery summary from voice-service: median / range of thinking time, length, pace, filler words. */
const ReportVoiceSummary = ({ summary }) => {
  const { t } = useTranslation("interview");
  const num = useInterviewNumber();

  let content;
  if (!summary.voice_turns) {
    content = <p className="text-sm text-muted">{t("voiceSummary.none")}</p>;
  } else {
    content = (
      <>
        <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
          {Object.entries(summary.stats || {}).map(([key, stat]) => {
            const known = STAT_KEYS.includes(key);
            const percent = key === "filler_ratio";
            const fmt = (value) => (percent ? num(value * 100, 0) : num(value));
            const unit = known ? t(`voiceSummary.stats.${key}.unit`) : "";
            return (
              <div key={key} className="flex flex-col gap-0.5 rounded-[10px] border border-tint-line px-3.5 py-3">
                <span className="text-sm text-muted">{known ? t(`voiceSummary.stats.${key}.label`) : key}</span>
                <b className="text-2xl leading-8">
                  {fmt(stat.median)} <small className="text-sm font-normal text-muted">{unit}</small>
                </b>
                <small className="text-sm font-normal text-muted">
                  {t("voiceSummary.range", { min: fmt(stat.min), max: fmt(stat.max), n: stat.n })}
                </small>
              </div>
            );
          })}
        </div>
        {summary.notes?.length > 0 && <ReportList items={summary.notes} render={(note) => note} />}
        <p className="mt-2 text-sm text-muted">{t("voiceSummary.disclaimer")}</p>
      </>
    );
  }

  return (
    <ReportPanel testId="interview-voice-summary">
      <ReportBlock title={t("voiceSummary.title")}>{content}</ReportBlock>
    </ReportPanel>
  );
};

export default ReportVoiceSummary;
