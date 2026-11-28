import { useTranslation } from "react-i18next";
import useInterviewLabel from "../../../hooks/useInterviewLabel";
import ReportBlock from "./ReportBlock";
import { ReportChip, ReportList, ReportPanel } from "./report-parts";

/** Cross-topic notes the AI kept during the session (state.notes). Informational: they do not change the score. */
const ReportAgentNotes = ({ notes }) => {
  const { t } = useTranslation("interview");
  const label = useInterviewLabel();
  if (!notes?.length) return null;
  return (
    <ReportPanel testId="interview-agent-notes">
      <ReportBlock title={t("agentNotes.title")}>
        <ReportList
          items={notes}
          render={(note) => (
            <>
              <ReportChip soft>{label("agentNotes.kind", note.kind)}</ReportChip> {note.text}{" "}
              <span className="text-sm text-muted">
                • {t("agentNotes.turn", { turn: note.turn })} • {label("agentNotes.status", note.status)}
              </span>
            </>
          )}
        />
      </ReportBlock>
    </ReportPanel>
  );
};

export default ReportAgentNotes;
