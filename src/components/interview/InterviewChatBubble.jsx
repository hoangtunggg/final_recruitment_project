import { useTranslation } from "react-i18next";
import { useLocale } from "../../i18n/helpers";
import { cx } from "../ui";
import { formatNumber } from "./interview-format";

// Delivery line under a spoken answer (FR-006 spec 015). Empty metrics are skipped.
const deliveryParts = (metrics, t, locale) => {
  const num = (value, digits) => formatNumber(value, locale, digits);
  const parts = [];
  if (metrics.thinking_time_s != null) parts.push(t("chat.delivery.thinking", { value: num(metrics.thinking_time_s) }));
  if (metrics.answer_duration_s != null) parts.push(t("chat.delivery.speaking", { value: num(metrics.answer_duration_s) }));
  if (metrics.speech_rate_spm != null) parts.push(t("chat.delivery.rate", { value: num(metrics.speech_rate_spm, 0) }));
  if (metrics.long_pause_count) parts.push(t("chat.delivery.pauses", { value: metrics.long_pause_count }));
  if (metrics.filler_ratio) parts.push(t("chat.delivery.fillers", { value: num(metrics.filler_ratio * 100, 0) }));
  return parts;
};

/**
 * One READ-ONLY bubble (AI left, candidate right). Text is rendered as text (never HTML). The tag line holds the
 * speaker plus, for AI questions, phase / topic / action; all labels are translated here from keys and raw data.
 */
const InterviewChatBubble = ({ message }) => {
  const { t, i18n } = useTranslation("interview");
  const locale = useLocale();
  const mine = message.who === "me";
  const known = (key) => (i18n.exists(`interview:${key}`) ? t(key) : "");

  const tagParts = mine
    ? [t(message.source === "voice" ? "chat.meVoice" : "chat.meText")]
    : [
        t("chat.aiTag"),
        message.meta?.phase && known(`phase.${message.meta.phase}`),
        message.meta?.topic,
        message.meta?.action && known(`action.${message.meta.action}`),
      ];
  const notes = [
    ...(message.metrics ? [deliveryParts(message.metrics, t, locale).join(" • ")] : []),
    ...(message.notes || []).map((note) => t(note.key)),
  ].filter(Boolean);

  return (
    <div
      data-testid={mine ? "interview-msg-me" : "interview-msg-ai"}
      className={cx(
        "max-w-[92%] whitespace-pre-wrap rounded-2xl px-[18px] py-3.5 text-lg font-normal leading-7 sm:max-w-[78%]",
        mine
          ? "self-end rounded-br-sm bg-primary-600 text-white"
          : "self-start rounded-bl-sm border border-tint-line bg-tint",
        message.rejected && "opacity-55"
      )}
    >
      <span className={cx("mb-1 block text-[13px] font-medium leading-[18px]", mine ? "text-white" : "text-primary-text")}>
        {tagParts.filter(Boolean).join(" • ")}
      </span>
      <span className={cx(message.pending && "italic opacity-90")}>
        {message.pending ? t("chat.transcribing") : message.text || "…"}
      </span>
      {notes.map((note) => (
        <span key={note} className="mt-1.5 block text-[13px] leading-[18px]">
          {note}
        </span>
      ))}
    </div>
  );
};

export default InterviewChatBubble;
