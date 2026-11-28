import { useTranslation } from "react-i18next";
import useInterviewStatusText from "../../hooks/useInterviewStatusText";
import { Button, Card } from "../ui";
import ReportAgentNotes from "./report/ReportAgentNotes";
import InterviewReport from "./report/InterviewReport";
import ReportVoiceSummary from "./report/ReportVoiceSummary";

// One line telling where the report is: loading / nothing to report / failed / done.
const resultStatus = (result) => {
  switch (result.phase) {
    case "empty":
      return { key: "result.empty" };
    case "error":
      return result.error;
    case "done":
      return { key: "result.done", values: { minutes: result.minutes, answers: result.turns.length } };
    default:
      return { key: "result.loading" };
  }
};

/**
 * Step 4: "done" card with a status line, then the report, the speaking-delivery summary and the AI's notes.
 * `result` = useInterviewResult().result, onRetry = fetch the report again, onRestart = start a new interview.
 */
const InterviewResultScreen = ({ result, onRetry, onRestart }) => {
  const { t } = useTranslation("interview");
  const statusText = useInterviewStatusText(resultStatus(result));
  const failed = result.phase === "error";

  return (
    <section aria-label={t("result.region")} data-testid="interview-result">
      <Card tone="tint" padding="lg" className="mx-auto w-full max-w-[625px] px-6 pb-10 pt-14 text-center sm:px-10">
        <h1 className="text-4xl font-extrabold leading-[48px]">
          {t("result.title")} <span aria-hidden="true">🙌</span>
        </h1>
        <p className="mx-auto mt-2.5 text-xl leading-7 text-muted">{t("result.lead")}</p>
        <p
          role="status"
          data-testid="interview-result-status"
          className={`mt-10 text-xl leading-[30px] ${failed ? "text-danger" : "text-ink"}`}
        >
          {statusText}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {failed && (
            <Button variant="outline" data-testid="interview-result-retry" onClick={onRetry}>
              {t("result.retry")}
            </Button>
          )}
          <Button data-testid="interview-restart" onClick={onRestart}>
            {t("result.restart")}
          </Button>
        </div>
      </Card>
      {result.phase === "done" && <InterviewReport report={result.report} turns={result.turns} />}
      {result.summary && <ReportVoiceSummary summary={result.summary} />}
      <ReportAgentNotes notes={result.notes} />
    </section>
  );
};

export default InterviewResultScreen;
