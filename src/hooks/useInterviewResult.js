// Result screen data (ported from interview-result.js): the report from ai-service /finalize and the speaking
// delivery summary from voice-service run in parallel; the report can be retried when it fails.
//   result = { phase: "idle" | "empty" | "loading" | "error" | "done", error?, report?, summary?, notes?, turns?, minutes? }
import { useCallback, useRef, useState } from "react";
import { describeInterviewError } from "../services/interviewErrors";
import { fetchVoiceSummary, finalizeInterview } from "../services/interviewService";

export default function useInterviewResult() {
  const [result, setResult] = useState({ phase: "idle" });
  const lastSnapshotRef = useRef(null);
  const summaryRef = useRef(null); // the voice summary is kept so retrying the report does not call Blaze again

  /**
   * snapshot = { sid, state, turns, voiceMetrics, durationS } taken when the interview ended
   * (the duration is frozen then, so time spent on this screen is not counted).
   */
  const run = useCallback(async (snapshot) => {
    lastSnapshotRef.current = snapshot;
    const notes = snapshot.state?.notes;
    if (!snapshot.turns.length) {
      setResult({ phase: "empty" });
      return;
    }
    setResult({ phase: "loading", notes });
    const [report, summary] = await Promise.allSettled([
      finalizeInterview({
        session_id: snapshot.sid,
        end_reason: snapshot.state?.end_reason || "plan_complete",
        duration_s: snapshot.durationS,
      }),
      summaryRef.current
        ? Promise.resolve(summaryRef.current)
        : fetchVoiceSummary(snapshot.voiceMetrics),
    ]);
    if (summary.status === "fulfilled") summaryRef.current = summary.value;
    const common = { notes, summary: summaryRef.current };
    if (report.status === "rejected") {
      setResult({
        phase: "error",
        error: describeInterviewError(report.reason, "result.reportFailed"),
        ...common,
      });
      return;
    }
    setResult({
      phase: "done",
      report: report.value,
      turns: snapshot.turns,
      minutes: Math.max(1, Math.round(snapshot.durationS / 60)),
      ...common,
    });
  }, []);

  const retry = useCallback(() => {
    if (lastSnapshotRef.current) run(lastSnapshotRef.current);
  }, [run]);

  return { result, run, retry };
}
