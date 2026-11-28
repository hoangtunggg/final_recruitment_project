// Spoken answers (ported from interview-voice.js onRecorded / toggleRecording): the mic button records, a finished
// recording is transcribed (STT, whole file) and the transcript is sent as the answer straight away, read-only,
// like a real interview. A recording that arrives late (turn changed / session ended) is dropped.
import { useCallback } from "react";
import { describeInterviewError, isUnauthorized } from "../services/interviewErrors";
import { transcribeRecording } from "../services/interviewService";

export default function useInterviewVoiceAnswer({
  sRef,
  chat,
  voice,
  submitTurn,
  applyTyping,
  setChatStatus,
  setRecStatus,
  setTranscribing,
  onUnauthorized,
}) {
  const { hasMic, isRecording, startRecording, stopRecording, getQuestionEndedAt, markServiceDown } = voice;

  /** A recording finished: STT -> bubble -> submit the transcript as the answer for `turnNumber`. */
  const handleRecorded = useCallback(
    async ({ blob, startedAt }, turnNumber) => {
      const S = sRef.current;
      setTranscribing(true);
      setRecStatus(null);
      const isStale = () => S.ended || turnNumber !== S.turn?.turn_number || Boolean(S.pending);
      const bubbleId = chat.add({ who: "me", source: "voice", text: "", pending: true });
      try {
        const stt = await transcribeRecording({
          blob,
          phrases: S.phrases,
          questionEndedAt: getQuestionEndedAt(),
          recordingStartedAt: startedAt,
          topicId: S.turn?.topic_id,
        });
        if (isStale()) {
          chat.remove(bubbleId); // recording of an older turn must not show up under a newer question
          return;
        }
        if (stt.no_speech) {
          chat.remove(bubbleId);
          setRecStatus({ key: "rec.noSpeech", tone: "warn" });
          return;
        }
        chat.patch(bubbleId, { pending: false, text: stt.transcript, metrics: stt.metrics });
        // The transcript is sent as is (not awaited: S.pending is set synchronously, the finally below sees it).
        submitTurn(stt.transcript, "voice", stt.metrics, bubbleId);
      } catch (error) {
        chat.remove(bubbleId);
        if (isStale()) return;
        if (isUnauthorized(error)) {
          onUnauthorized();
        } else if (error instanceof TypeError || (error.status ?? 0) >= 502) {
          // Voice-service went down mid-session: carry on by typing.
          markServiceDown();
          applyTyping(true);
          setRecStatus({ key: "rec.serviceDownTyping", tone: "warn" });
        } else {
          setRecStatus(describeInterviewError(error));
        }
      } finally {
        setTranscribing(false);
      }
    },
    [sRef, chat, getQuestionEndedAt, submitTurn, applyTyping, markServiceDown, setRecStatus, setTranscribing, onUnauthorized]
  );

  /** Mic button: stop (and send) when recording, otherwise start recording this turn's answer. */
  const toggleRecording = useCallback(() => {
    if (isRecording()) {
      stopRecording();
      return;
    }
    if (!hasMic()) {
      applyTyping(true);
      setRecStatus({ key: "rec.micOffTyping", tone: "warn" });
      return;
    }
    setChatStatus(null); // clear an old warning (e.g. "send" pressed with an empty box)
    setRecStatus(null);
    const turnNumber = sRef.current.turn?.turn_number;
    startRecording((recording) => handleRecorded(recording, turnNumber));
  }, [isRecording, stopRecording, hasMic, startRecording, applyTyping, sRef, setChatStatus, setRecStatus, handleRecorded]);

  return { toggleRecording };
}
