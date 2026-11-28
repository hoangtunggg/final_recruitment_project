// Streams one interview question (SSE) into a new AI bubble and keeps the topic progress
// ({index, total, turnNumber}) that the progress bar shows. Used for the first question (start) and every
// following one (next-turn).
import { useCallback, useEffect, useRef, useState } from "react";
import { findTopicTitle } from "../components/interview/interview-format";
import { nextTurnStream, startInterviewStream } from "../services/interviewService";

export default function useInterviewQuestionStream({ sRef, chat }) {
  const [progress, setProgress] = useState(null);
  const abortRef = useRef(null);

  // One controller for every request of this page visit: leaving the page stops the LLM call that is in flight.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    []
  );
  const getSignal = useCallback(() => (abortRef.current ??= new AbortController()).signal, []);

  const resetProgress = useCallback(() => setProgress(null), []);

  /** A question arrived: show its turn number next to the topic counter. */
  const showTurnNumber = useCallback(
    (turnNumber) => {
      const known = sRef.current.progress;
      if (known) setProgress({ ...known, turnNumber });
    },
    [sRef]
  );

  /**
   * Streams one question into a new AI bubble. kind = "start" | "next-turn".
   * Resolves with the `done` payload; a failed / cut stream removes the half-written bubble and throws.
   */
  const streamQuestion = useCallback(
    async (kind, body) => {
      const S = sRef.current;
      const id = chat.add({ who: "ai", text: "", streaming: true });
      let meta = null;
      const run = kind === "start" ? startInterviewStream : nextTurnStream;
      let done;
      try {
        done = await run(
          body,
          (name, data) => {
            if (S.ended) return;
            if (name === "meta") {
              meta = data;
              S.progress = { index: data.topic_index, total: data.topic_total };
              setProgress({ ...S.progress, turnNumber: null });
            }
            if (name === "token") chat.append(id, data.t);
            if (name === "replace") chat.patch(id, { text: data.question });
          },
          getSignal()
        );
      } catch (error) {
        chat.remove(id); // half-written question: drop it, a retry writes it again
        throw error;
      }
      if (!done.turn || S.ended) {
        chat.remove(id);
        return done;
      }
      chat.patch(id, {
        text: done.question,
        streaming: false,
        meta: {
          phase: meta?.phase || done.turn.phase,
          topic: findTopicTitle(done.turn.topic_id, done.plan || S.plan),
          action: meta?.action,
        },
      });
      return done;
    },
    [sRef, chat, getSignal]
  );

  return { progress, resetProgress, showTurnNumber, streamQuestion };
}
