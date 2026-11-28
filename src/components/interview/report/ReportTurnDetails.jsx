import { useTranslation } from "react-i18next";
import useInterviewNumber from "../../../hooks/useInterviewNumber";
import { ReportChip } from "./report-parts";

/**
 * Collapsible per-question detail: the question, what the candidate answered (kept by the page, matched by
 * turn number), the turn score and the evaluator's comment.
 */
const ReportTurnDetails = ({ reportTurns, answers }) => {
  const { t } = useTranslation("interview");
  const num = useInterviewNumber();
  if (!reportTurns.length) return null;
  const mine = Object.fromEntries((answers || []).map((turn) => [turn.turn_number, turn]));

  return (
    <details className="mt-6" data-testid="interview-turn-details">
      <summary className="cursor-pointer text-lg font-bold">
        {t("report.turnDetails", { total: reportTurns.length })}
      </summary>
      {reportTurns.map((turn) => {
        const answer = mine[turn.turn_number];
        return (
          <div key={turn.turn_number} className="mt-3 border-t border-tint-line pt-3 font-normal">
            <p className="font-medium">{turn.question}</p>
            {answer && <p className="my-1 italic text-muted">{answer.answer}</p>}
            <p className="mt-1">
              <ReportChip soft>{num(answer?.evaluation?.turn_score_10)}/10</ReportChip> {turn.comment}
            </p>
          </div>
        );
      })}
    </details>
  );
};

export default ReportTurnDetails;
