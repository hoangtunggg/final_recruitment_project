// MediaRecorder wrapper of voice mode: records the answer from the microphone stream and hands the finished
// audio to a callback. Capped at 3 minutes (Blaze bills the whole recording).
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "../components/interview/interview-constants";

const RECORDER_MIME_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];

/**
 * @param {{getStream: () => MediaStream|null, onBeforeStart: () => void}} options
 *   getStream = current microphone stream; onBeforeStart = called right before recording (stops the TTS voice).
 */
export default function useInterviewRecorder({ getStream, onBeforeStart }) {
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const isRecording = useCallback(() => Boolean(recorderRef.current), []);

  /**
   * Starts recording. onFinished({ blob, startedAt }) fires when it stops (user, or the 3 minute cap).
   * Returns false when there is no microphone.
   */
  const startRecording = useCallback(
    (onFinished) => {
      const stream = getStream();
      if (!stream) return false;
      onBeforeStart();
      const mimeType = RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const startedAt = Date.now();
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        clearInterval(timerRef.current);
        recorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        onFinished({ blob, startedAt });
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        const seconds = Math.round((Date.now() - startedAt) / 1000);
        setRecordingSeconds(seconds);
        if (seconds >= MAX_RECORDING_SECONDS) recorderRef.current?.stop();
      }, 500);
      return true;
    },
    [getStream, onBeforeStart]
  );

  /** Normal stop: triggers onFinished, so the recording is transcribed and sent. */
  const stopRecording = useCallback(() => recorderRef.current?.stop(), []);

  /** Throws the recording away (session ended / unmount): no onFinished. */
  const abortRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.onstop = null;
    if (recorder.state !== "inactive") recorder.stop();
    clearInterval(timerRef.current);
    recorderRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => abortRecording, [abortRecording]); // leaving the page discards a recording in progress

  return { recording, recordingSeconds, isRecording, startRecording, stopRecording, abortRecording };
}
