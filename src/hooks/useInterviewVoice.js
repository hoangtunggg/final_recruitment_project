// Device layer of voice mode (ported from interview-voice.js): microphone stream + level meter, voice-service
// health and TTS playback of questions; recording itself is in useInterviewRecorder. It knows nothing about
// turns: the session hook decides what to do with a finished recording (STT -> answer).
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSpeech, fetchVoiceHealth, isVoiceHealthy } from "../services/interviewService";
import useInterviewRecorder from "./useInterviewRecorder";

const MAX_TTS_CHARS = 1000;

export default function useInterviewVoice() {
  const [micOn, setMicOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // 0-4 bars
  const [serviceState, setServiceState] = useState("unchecked"); // unchecked | checking | ok | down
  const [speakState, setSpeakState] = useState("idle"); // idle | loading | playing | ended | failed | unavailable

  // Mutable device state: read from async handlers, so it lives in refs rather than in render state.
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const meterTimerRef = useRef(null);
  const audioRef = useRef(null);
  const speakSeqRef = useRef(0); // bumps whenever speech is cancelled, so late TTS responses are dropped
  const questionEndedAtRef = useRef(null); // when the question finished being read (thinking-time anchor)
  const serviceOkRef = useRef(false);
  const micGenerationRef = useRef(0); // bumped on every release: a getUserMedia that resolves later must not keep the mic

  const hasMic = useCallback(() => Boolean(streamRef.current), []);
  const isReady = useCallback(() => Boolean(streamRef.current && serviceOkRef.current), []);
  const getQuestionEndedAt = useCallback(() => questionEndedAtRef.current, []);
  const getStream = useCallback(() => streamRef.current, []);

  const releaseMic = useCallback(() => {
    micGenerationRef.current += 1;
    clearInterval(meterTimerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setMicOn(false);
    setMicLevel(0);
  }, []);

  /** Asks the browser for the microphone (call after a user gesture) and starts the level meter. Throws if denied. */
  const enableMic = useCallback(async () => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("mic_unsupported");
    const generation = micGenerationRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    // The page was left (or the mic released) while the browser prompt was open, or a second click already got a
    // stream: drop this one so the recording indicator does not stay on.
    if (generation !== micGenerationRef.current || streamRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    streamRef.current = stream;
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;
    const samples = new Uint8Array(analyser.fftSize);
    meterTimerRef.current = setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let peak = 0;
      for (const value of samples) peak = Math.max(peak, Math.abs(value - 128));
      setMicLevel(Math.min(4, Math.ceil(peak / 12)));
    }, 120);
    setMicOn(true);
  }, []);

  /** Pings voice-service; the page keeps working by typing when it is down. */
  const checkService = useCallback(async () => {
    setServiceState("checking");
    const healthy = isVoiceHealthy(await fetchVoiceHealth());
    serviceOkRef.current = healthy;
    setServiceState(healthy ? "ok" : "down");
    return healthy;
  }, []);

  /** Voice-service failed mid-session (STT 5xx / network): from now on questions are not read aloud. */
  const markServiceDown = useCallback(() => {
    serviceOkRef.current = false;
    setServiceState("down");
  }, []);

  /** Stops reading the question. The "finished reading" anchor becomes now if it was not set yet. */
  const stopSpeaking = useCallback(() => {
    speakSeqRef.current += 1;
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
    questionEndedAtRef.current ??= Date.now();
    setSpeakState((state) => (state === "loading" || state === "playing" ? "idle" : state));
  }, []);

  const recorder = useInterviewRecorder({ getStream, onBeforeStart: stopSpeaking });
  const { isRecording } = recorder;

  /** Reads a question aloud (TTS). If it cannot, the question is treated as "read" the moment it is shown. */
  const speak = useCallback(
    async (text) => {
      if (isRecording()) return; // never read over a recording
      stopSpeaking();
      questionEndedAtRef.current = null;
      speakSeqRef.current += 1;
      const seq = speakSeqRef.current;
      if (!serviceOkRef.current || !text || text.length > MAX_TTS_CHARS) {
        questionEndedAtRef.current = Date.now();
        setSpeakState(serviceOkRef.current ? "idle" : "unavailable");
        return;
      }
      try {
        setSpeakState("loading");
        const blob = await fetchSpeech(text);
        if (seq !== speakSeqRef.current) return; // user already recorded / moved on while it loaded
        audioRef.current ??= new Audio();
        const audio = audioRef.current;
        if (audio.src) URL.revokeObjectURL(audio.src);
        audio.src = URL.createObjectURL(blob);
        audio.onended = () => {
          questionEndedAtRef.current = Date.now();
          setSpeakState("ended");
        };
        setSpeakState("playing");
        await audio.play();
      } catch {
        if (seq !== speakSeqRef.current) return;
        questionEndedAtRef.current = Date.now();
        setSpeakState("failed");
      }
    },
    [isRecording, stopSpeaking]
  );

  // Leaving the page must release the microphone (browser recording indicator) and stop any audio.
  useEffect(
    () => () => {
      releaseMic();
      speakSeqRef.current += 1;
      audioRef.current?.pause();
    },
    [releaseMic]
  );

  return {
    micOn,
    micLevel,
    serviceState,
    serviceOk: serviceState === "ok",
    speakState,
    ...recorder,
    hasMic,
    isReady,
    getQuestionEndedAt,
    enableMic,
    disableMic: releaseMic,
    checkService,
    markServiceDown,
    speak,
    stopSpeaking,
  };
}
