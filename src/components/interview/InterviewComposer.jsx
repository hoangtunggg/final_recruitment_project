import { useEffect, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Textarea } from "../ui";
import InterviewRecorderButton from "./InterviewRecorderButton";
import InterviewStatusLine from "./InterviewStatusLine";
import { formatClock } from "./interview-format";

// What the small line under the mic says. Priority: recording > transcribing > a message set by the flow
// (no speech, mic off ...) > TTS state > the default prompt. Returns a status descriptor or null.
const recorderLine = ({ recorderState, recStatus, voice, turns }) => {
  if (recorderState === "recording") return { key: "rec.recording", values: { time: formatClock(voice.recordingSeconds) } };
  if (recorderState === "busy") return { key: "rec.transcribing" };
  if (recStatus) return recStatus;
  if (turns.busy) return null; // the chat status line explains what the AI is doing
  if (voice.speakState === "loading" || voice.speakState === "playing") return { key: "rec.reading" };
  if (voice.speakState === "unavailable") return { key: "rec.voiceUnavailable", tone: "warn" };
  if (voice.speakState === "failed") return { key: "rec.speakFailed", tone: "warn" };
  return turns.typing ? null : { key: "rec.pressMic" };
};

/**
 * Sticky answer area: big mic button, optional typing box + "send", replay / switch-mode links, retry after a
 * failed send. `session` = the view model of useInterviewSession.
 */
const InterviewComposer = ({ session }) => {
  const { t } = useTranslation("interview");
  const { turns, voice, controls, recorderState } = session;
  const answerRef = useRef(null);
  const voiceReady = voice.micOn && voice.serviceOk;

  // Typing mode: keep the cursor in the box (again after each AI turn re-enables it).
  useEffect(() => {
    if (turns.typing && !turns.busy) answerRef.current?.focus();
  }, [turns.typing, turns.busy]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      turns.sendAnswer();
    }
  };

  return (
    <div className="sticky bottom-0 z-[2] bg-gradient-to-t from-canvas from-80% to-transparent pb-3 pt-8">
      <div className="mx-auto flex w-full max-w-[824px] flex-col items-center rounded-[10px] border border-tint-line bg-tint px-4 pb-4 pt-3 sm:px-[30px]">
        <InterviewRecorderButton
          state={recorderState}
          disabled={controls.micDisabled}
          onClick={session.toggleRecording}
        />
        <InterviewStatusLine
          status={recorderLine(session)}
          center
          testId="interview-rec-status"
        />
        {turns.typing && (
          <Textarea
            ref={answerRef}
            aria-label={t("question.answerLabel")}
            data-testid="interview-answer"
            className="mt-4 w-full"
            rows={3}
            placeholder={t("question.answerPlaceholder")}
            value={turns.answer}
            disabled={controls.answerDisabled}
            onChange={(event) => turns.setAnswer(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-x-6">
          <Button
            variant="link"
            className="min-h-11 text-sm !text-muted hover:!text-primary-text"
            data-testid="interview-replay"
            disabled={controls.sideDisabled}
            onClick={turns.replayQuestion}
          >
            {t("question.replay")}
          </Button>
          {!(turns.typing && !voiceReady) && (
            <Button
              variant="link"
              className="min-h-11 text-sm !text-muted hover:!text-primary-text"
              data-testid="interview-toggle-typing"
              disabled={controls.sideDisabled}
              onClick={turns.toggleTyping}
            >
              {turns.typing ? t("question.useVoice") : t("question.useTyping")}
            </Button>
          )}
        </div>
      </div>
      {(turns.typing || turns.showRetry) && (
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {turns.typing && (
            <Button
              data-testid="interview-send"
              disabled={controls.sendDisabled}
              rightIcon={<FiSend aria-hidden="true" />}
              onClick={turns.sendAnswer}
            >
              {t("question.send")}
            </Button>
          )}
          {turns.showRetry && (
            <Button variant="outline" data-testid="interview-retry" onClick={turns.runNextTurn}>
              {t("question.retry")}
            </Button>
          )}
        </div>
      )}
      <InterviewStatusLine status={turns.chatStatus} center className="mt-2" testId="interview-chat-status" />
      <p className="mt-1 text-center text-sm">{t("question.note")}</p>
    </div>
  );
};

export default InterviewComposer;
