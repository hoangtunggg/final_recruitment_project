// Question / answer loop of the interview (ported from interview-turn.js): streams each question into an AI
// bubble (SSE), tracks topic progress, sends typed or spoken answers, retries failed sends, and asks before
// treating "I want to stop" as the end of the session. Session data (plan, state, turns, pending turn ...) is
// kept in `sRef` because the async handlers below must always see the latest values.
import { useCallback, useState } from "react";
import { elapsedSeconds } from "../components/interview/interview-format";
import { canRetryTurn, describeInterviewError, isUnauthorized } from "../services/interviewErrors";
import { wantsToStop } from "../services/interviewStopIntent";
import useInterviewQuestionStream from "./useInterviewQuestionStream";

export default function useInterviewTurns({
  sRef,
  chat,
  voice,
  confirm,
  finalizeSession,
  onUnauthorized,
  setRecStatus,
  setTranscribing,
}) {
  const [busy, setBusy] = useState(false); // AI is working: inputs locked
  const [chatStatus, setChatStatus] = useState(null);
  const [showRetry, setShowRetry] = useState(false);
  const [typing, setTyping] = useState(false);
  const [answer, setAnswer] = useState("");
  const { speak, stopSpeaking, isReady } = voice;
  const { progress, resetProgress, showTurnNumber, streamQuestion } = useInterviewQuestionStream({ sRef, chat });

  /** Typing mode on/off. Typing stops the voice that is reading the question. */
  const applyTyping = useCallback(
    (on) => {
      setTyping(on);
      if (on) stopSpeaking();
    },
    [stopSpeaking]
  );

  /** A new question has fully arrived: reset the inputs, show typing or voice mode, read it aloud. */
  const showQuestion = useCallback(
    (done) => {
      const S = sRef.current;
      if (S.ended) return;
      S.question = done.question;
      S.turn = done.turn;
      showTurnNumber(done.turn.turn_number);
      setAnswer("");
      // No microphone / voice service: open the typing box straight away.
      applyTyping(Boolean(S.preferTyping) || !isReady());
      setBusy(false);
      setChatStatus(null);
      setRecStatus(null);
      speak(done.question);
    },
    [sRef, applyTyping, isReady, setRecStatus, showTurnNumber, speak]
  );

  /** Locks the inputs while the first question is prepared. */
  const beginPreparing = useCallback(() => {
    setBusy(true);
    setChatStatus({ key: "chat.preparing" });
    resetProgress();
    setShowRetry(false);
    setAnswer("");
  }, [resetProgress]);

  /** Sends S.pending (also the "send again" button: ai-service replays a turn it already finished). */
  const runNextTurn = useCallback(async () => {
    const S = sRef.current;
    const { answer: sent, source, metrics, bubbleId, body } = S.pending;
    const turn = S.turn;
    setShowRetry(false);
    setBusy(true);
    setChatStatus({ key: "chat.listening" });
    try {
      const done = await streamQuestion("next-turn", body);
      if (S.ended) return; // ended while the AI was busy: the report already ran without this turn
      S.turns.push({
        turn_number: turn.turn_number,
        phase: turn.phase,
        topic_id: turn.topic_id,
        turn_kind: turn.turn_kind,
        difficulty: turn.difficulty,
        question: S.question,
        answer: sent,
        evaluation: done.evaluation,
      });
      if (source === "voice" && metrics) S.voiceMetrics.push(metrics);
      S.state = done.state;
      S.pending = null;
      if (done.session_end) {
        finalizeSession(false);
        return;
      }
      showQuestion(done);
    } catch (error) {
      if (S.ended) return;
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setBusy(false);
      setTranscribing(false);
      if (error.code?.startsWith("voice_")) {
        // ai-service did not count the turn (e.g. only filler words): the candidate answers again.
        S.pending = null;
        chat.markRejected(bubbleId, { key: "chat.notCounted" });
        setChatStatus(null);
        setRecStatus({ key: "rec.noSpeechCounted", raw: error.serverMessage, tone: "warn" });
        return;
      }
      if (!canRetryTurn(error)) {
        // Sending the same text again would fail the same way: answer again or end the session.
        S.pending = null;
        chat.markRejected(bubbleId, { key: "chat.notSent" });
        if (source === "text") {
          setAnswer(sent);
          applyTyping(true);
        }
        setChatStatus(describeInterviewError(error));
        return;
      }
      setShowRetry(true); // keep the exact body so "send again" is idempotent
      setChatStatus(describeInterviewError(error));
    }
  }, [sRef, chat, streamQuestion, finalizeSession, showQuestion, applyTyping, onUnauthorized, setRecStatus, setTranscribing]);

  /** One answer (typed, or the transcript of a recording) becomes a turn. bubbleId = its read-only bubble. */
  const submitTurn = useCallback(
    async (text, source, metrics, bubbleId) => {
      const S = sRef.current;
      if (S.ended) return;
      if (wantsToStop(text)) {
        setBusy(true);
        const stop = await confirm.ask({
          titleKey: "stop.title",
          textKey: "stop.text",
          okKey: "stop.ok",
          cancelKey: "stop.cancel",
        });
        if (S.ended) return; // ended elsewhere while the dialog was open
        if (stop) {
          chat.addNote(bubbleId, { key: "chat.stopped" });
          finalizeSession(true);
          return;
        }
      }
      stopSpeaking();
      // ai-service keeps plan / state / question / topic turns in the session checkpoint: only the new part of the turn is sent.
      S.pending = {
        answer: text,
        source,
        metrics,
        bubbleId,
        body: {
          session_id: S.sid,
          turn_number: S.turn.turn_number,
          answer: text,
          elapsed_seconds: elapsedSeconds(S.startedAt),
          answer_source: source,
        },
      };
      await runNextTurn();
    },
    [sRef, chat, confirm, finalizeSession, stopSpeaking, runNextTurn]
  );

  const recorderBlocked = voice.recording || showRetry;

  /** "Send" button / Ctrl+Enter in typing mode. */
  const sendAnswer = useCallback(async () => {
    if (busy || recorderBlocked) return;
    const text = answer.trim();
    if (!text) {
      setChatStatus({ key: "chat.emptyAnswer", tone: "warn" });
      return;
    }
    setAnswer("");
    const bubbleId = chat.add({ who: "me", source: "text", text });
    await submitTurn(text, "text", null, bubbleId);
  }, [busy, recorderBlocked, answer, chat, submitTurn]);

  /** Switch between voice and typing; the choice is kept for the following questions. */
  const toggleTyping = useCallback(() => {
    const next = !typing;
    sRef.current.preferTyping = next;
    applyTyping(next);
    setRecStatus(null);
  }, [typing, sRef, applyTyping, setRecStatus]);

  const replayQuestion = useCallback(() => speak(sRef.current.question), [sRef, speak]);

  return {
    progress,
    busy,
    chatStatus,
    setChatStatus,
    showRetry,
    typing,
    answer,
    setAnswer,
    applyTyping,
    beginPreparing,
    streamQuestion,
    showQuestion,
    submitTurn,
    runNextTurn,
    sendAnswer,
    toggleTyping,
    replayQuestion,
  };
}
