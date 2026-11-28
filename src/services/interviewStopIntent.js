// Detects "I want to stop the interview" in a spoken or typed answer (ported from interview-turn.js).
// ai-service's Evaluator has no "wants to stop" answer type, so the page asks for confirmation itself.
// It only fires when the sentence is aimed at the interview ("dừng phỏng vấn", "không muốn trả lời nữa") or is
// nothing but a stop phrase ("Dừng lại", "Em xin dừng ở đây"); "timer dừng ngay" or "cho dừng container" do not count.
// No \b on purpose: JS treats accented letters (e.g. "ề") as word boundaries.
const STOP_SESSION =
  /(dừng|ngừng|kết thúc|nghỉ|bỏ)( lại)?( cuộc| buổi)? phỏng vấn|không (muốn )?(phỏng vấn|trả lời|tiếp tục phỏng vấn|tiếp tục buổi này) nữa/;
const STOP_ALONE =
  /^(((em|tôi|mình|cho (em|tôi|mình)) )?(xin |muốn )?)?(thôi )?(dừng|ngừng|nghỉ|kết thúc)( lại| ở đây| tại đây| luôn| đi| nhé| ạ| thôi| ngay| buổi này)*$/;
// English equivalents so an EN-speaking candidate gets the same safety net.
const STOP_SESSION_EN = /\b(stop|end|quit|finish) (the |this )?interview\b/;
const STOP_ALONE_EN = /^(please |i want to |let'?s |i'?d like to )?(stop|quit|end|finish)( here| now| please| it)*$/;

const normalizeSpeech = (text) =>
  text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,!?;:…"“”'()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const wantsToStop = (text) => {
  const normalized = normalizeSpeech(text);
  return (
    normalized.length <= 160 &&
    (STOP_SESSION.test(normalized) ||
      STOP_ALONE.test(normalized) ||
      STOP_SESSION_EN.test(normalized) ||
      STOP_ALONE_EN.test(normalized))
  );
};
