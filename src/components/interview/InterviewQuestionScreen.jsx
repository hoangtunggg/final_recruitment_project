import { useTranslation } from "react-i18next";
import InterviewChatLog from "./InterviewChatLog";
import InterviewComposer from "./InterviewComposer";
import InterviewProgressBar from "./InterviewProgressBar";
import InterviewVoiceMeters from "./InterviewVoiceMeters";

/** Step 3: the interview itself (chat with the AI interviewer). `session` = useInterviewSession(). */
const InterviewQuestionScreen = ({ session }) => {
  const { t } = useTranslation("interview");
  return (
    <section aria-label={t("question.region")} data-testid="interview-question">
      <InterviewProgressBar
        progress={session.turns.progress}
        durationMinutes={session.duration}
        onEnd={session.endByButton}
      />
      <InterviewChatLog messages={session.chat.messages} />
      <InterviewComposer session={session} />
      <InterviewVoiceMeters voice={session.voice} />
    </section>
  );
};

export default InterviewQuestionScreen;
