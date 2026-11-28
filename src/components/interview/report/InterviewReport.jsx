import { useTranslation } from "react-i18next";
import useInterviewLabel from "../../../hooks/useInterviewLabel";
import useInterviewNumber from "../../../hooks/useInterviewNumber";
import ReportBlock from "./ReportBlock";
import ReportScoreRow from "./ReportScoreRow";
import ReportStudyPlan from "./ReportStudyPlan";
import ReportTurnDetails from "./ReportTurnDetails";
import { ReportChip, ReportList, ReportPanel } from "./report-parts";

const strip = (text) => String(text ?? "").replace(/[.:;]\s*$/, "");

/**
 * Candidate-facing report from ai-service /finalize: overall score and verdict, scores per phase and criterion,
 * strengths, improvements, study plan, job-requirement coverage and per-question details. Only information meant
 * for the candidate is shown (no raw JSON or internal field names). `turns` = the answers the candidate gave.
 */
const InterviewReport = ({ report, turns }) => {
  const { t } = useTranslation("interview");
  const label = useInterviewLabel();
  const num = useInterviewNumber();
  const overall = report.overall || {};
  const criteria = Object.entries(report.criteria || {}).filter(([, value]) => value != null);
  const requirements = report.requirements?.items?.length ? report.requirements : null;

  return (
    <ReportPanel testId="interview-report">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
        <div
          data-testid="interview-score"
          className="whitespace-nowrap text-[56px] font-extrabold leading-[60px] text-primary-text"
        >
          {overall.score == null ? "–" : num(overall.score)}
          <small className="text-[22px] font-medium text-muted">/10</small>
        </div>
        <div className="font-normal">
          <ReportChip>{label("report.verdict", overall.verdict) || t("report.verdictUnknown")}</ReportChip>
          <p className="mt-2">{overall.summary}</p>
          {report.level_signal && (
            <p className="mt-2 text-sm text-muted">
              {t("report.levelSignal", { level: report.level_signal.suggested_level })}
            </p>
          )}
        </div>
      </div>
      {report.status === "partial" && <p className="mt-4 text-sm text-muted">{t("report.partial")}</p>}

      <ReportBlock title={t("report.bySection")} className="mt-8">
        {report.sections?.length > 0 &&
          report.sections.map((section) => (
            <ReportScoreRow key={section.phase} label={label("phase", section.phase)} score={section.score} />
          ))}
      </ReportBlock>
      <ReportBlock title={t("report.byCriterion")}>
        {criteria.length > 0 &&
          criteria.map(([key, value]) => (
            <ReportScoreRow key={key} label={label("report.criteria", key)} score={value} />
          ))}
      </ReportBlock>
      <ReportBlock title={t("report.strengths")}>
        {report.strengths?.length > 0 && <ReportList items={report.strengths} render={(item) => item.point} />}
      </ReportBlock>
      <ReportBlock title={t("report.improvements")}>
        {report.improvements?.length > 0 && (
          <ReportList
            items={report.improvements}
            render={(item) => (
              <>
                <b>{strip(item.point)}</b>
                {item.why ? `: ${item.why}` : ""}
              </>
            )}
          />
        )}
      </ReportBlock>
      <ReportBlock title={t("report.studyPlan")}>
        {report.study_plan?.length > 0 && <ReportStudyPlan items={report.study_plan} />}
      </ReportBlock>
      <ReportBlock title={t("report.requirements")}>
        {requirements && (
          <>
            <p className="mb-2 text-sm text-muted">{requirements.summary}</p>
            <ReportList
              items={requirements.items}
              render={(item) => (
                <>
                  {item.text}{" "}
                  <ReportChip soft>
                    {item.status === "assessed"
                      ? `${label("report.verdict", item.band)} • ${num(item.score)}`
                      : t("report.notAsked")}
                  </ReportChip>
                </>
              )}
            />
          </>
        )}
      </ReportBlock>
      <ReportTurnDetails reportTurns={report.turns || []} answers={turns} />
      {report.meta?.disclaimer && <p className="mt-5 text-sm text-muted">{report.meta.disclaimer}</p>}
    </ReportPanel>
  );
};

export default InterviewReport;
