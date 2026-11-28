// Orchestrates one interview visit: setup -> permission -> question (chat) -> result.
// The page's old global state `S` is `sRef` here; the device layer, turn loop, spoken answers and report each
// live in their own hook (useInterviewVoice / Turns / VoiceAnswer / Result) and are composed below.
import { useCallback, useRef, useState } from "react";
import { elapsedSeconds } from "../components/interview/interview-format";
import { describeInterviewError, isUnauthorized } from "../services/interviewErrors";
import useInterviewChat from "./useInterviewChat";
import useInterviewClock from "./useInterviewClock";
import useInterviewConfirm from "./useInterviewConfirm";
import useInterviewResult from "./useInterviewResult";
import useInterviewTurns from "./useInterviewTurns";
import useInterviewVoice from "./useInterviewVoice";
import useInterviewVoiceAnswer from "./useInterviewVoiceAnswer";

// ai-service wants 8-128 chars of [A-Za-z0-9_-]; randomUUID is only missing on insecure origins.
const newSessionId = () =>
  `web-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;

const scrollToTop = () => window.scrollTo(0, 0);

export default function useInterviewSession({ onUnauthorized }) {
  const sRef = useRef(null); // the current session's data (plan, state, turns, pending turn ...)
  const [screen, setScreen] = useState("setup"); // setup | permission | question | result
  const [startError, setStartError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [recStatus, setRecStatus] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [duration, setDuration] = useState(0); // minutes of the current session (for the countdown)

  const chat = useInterviewChat();
  const voice = useInterviewVoice();
  const confirm = useInterviewConfirm();
  const { result, run: runResult, retry: retryResult } = useInterviewResult();

  /** End of the session (by the candidate, or the plan is complete): free the devices, then build the report. */
  const finalizeSession = useCallback(
    (byCandidate) => {
      const S = sRef.current;
      S.ended = true; // late STT / next-turn results after this point are ignored
      voice.stopSpeaking();
      voice.abortRecording();
      voice.disableMic(); // turns the browser's recording indicator off
      S.durationS ??= elapsedSeconds(S.startedAt); // retrying the report keeps the duration at the moment it ended
      if (byCandidate && S.state) S.state.end_reason = "candidate_ended";
      setScreen("result");
      scrollToTop();
      runResult({
        sid: S.sid,
        state: S.state,
        turns: S.turns,
        voiceMetrics: S.voiceMetrics,
        durationS: S.durationS,
      });
    },
    [voice, runResult]
  );

  const turns = useInterviewTurns({
    sRef,
    chat,
    voice,
    confirm,
    finalizeSession,
    onUnauthorized,
    setRecStatus,
    setTranscribing,
  });
  const { toggleRecording } = useInterviewVoiceAnswer({
    sRef,
    chat,
    voice,
    submitTurn: turns.submitTurn,
    applyTyping: turns.applyTyping,
    setChatStatus: turns.setChatStatus,
    setRecStatus,
    setTranscribing,
    onUnauthorized,
  });

  /** Setup finished (CV / JD parsed): remember the configuration and go ask for the microphone. */
  const begin = useCallback(
    (config) => {
      sRef.current = {
        ...config,
        sid: newSessionId(),
        turns: [],
        voiceMetrics: [],
        ended: false,
        pending: null,
      };
      setDuration(config.duration);
      setStartError(null);
      setPermissionStatus(null);
      setScreen("permission");
      scrollToTop();
      voice.checkService();
    },
    [voice]
  );

  const backToSetup = useCallback(() => {
    setScreen("setup");
    scrollToTop();
  }, []);

  const enableMic = useCallback(async () => {
    if (voice.hasMic()) return;
    try {
      await voice.enableMic();
      setPermissionStatus(null);
    } catch {
      setPermissionStatus({ key: "permission.micDenied", tone: "warn" });
    }
  }, [voice]);

  /** Permission screen -> first question (works without microphone / voice service: the candidate types). */
  const startInterview = useCallback(async () => {
    const S = sRef.current;
    setScreen("question");
    scrollToTop();
    chat.clear();
    turns.beginPreparing();
    S.startedAt = Date.now();
    setStartedAt(S.startedAt);
    try {
      const done = await turns.streamQuestion("start", {
        session_id: S.sid,
        track: S.track,
        level: S.level,
        duration_minutes: S.duration,
        cv_profile: S.cv,
        jd_profile: S.jd,
        ...(S.jobId ? { job_id: S.jobId } : {}), // the FSD job; interview-service keeps it, ai-service never sees it
      });
      S.plan = done.plan;
      S.state = done.state;
      turns.showQuestion(done);
    } catch (error) {
      if (S.ended) return;
      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }
      setStartedAt(null);
      setScreen("setup");
      scrollToTop();
      setStartError(describeInterviewError(error, "setup.startFailed")); // incl. 429 quota and 502/504
    }
  }, [chat, turns, onUnauthorized]);

  /** "End and see results" button, with a confirmation. */
  const endByButton = useCallback(async () => {
    const hasAnswers = sRef.current.turns.length > 0;
    const yes = await confirm.ask({
      titleKey: "end.title",
      textKey: hasAnswers ? "end.textWithAnswers" : "end.textNoAnswers",
      okKey: "end.ok",
      cancelKey: "end.cancel",
    });
    if (yes && !sRef.current.ended) finalizeSession(true);
  }, [confirm, finalizeSession]);

  const remainingSeconds = useInterviewClock({
    running: screen === "question",
    startedAt,
    durationMinutes: duration,
  });

  const recorderState = voice.recording ? "recording" : transcribing ? "busy" : "idle";
  const controls = {
    micDisabled: turns.busy || recorderState === "busy" || turns.showRetry,
    sendDisabled: turns.busy || recorderState !== "idle" || turns.showRetry,
    sideDisabled: turns.busy || recorderState !== "idle",
    answerDisabled: turns.busy,
  };

  return {
    screen,
    begin,
    backToSetup,
    startError,
    permissionStatus,
    enableMic,
    startInterview,
    endByButton,
    toggleRecording,
    remainingSeconds,
    recStatus,
    recorderState,
    controls,
    chat,
    voice,
    confirm,
    turns,
    result,
    retryResult,
    duration,
  };
}
