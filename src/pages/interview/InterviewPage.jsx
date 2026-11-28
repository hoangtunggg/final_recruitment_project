// /interview: AI mock interview, ported from the AI repo's dev interview page (look and behaviour).
// Steps: setup -> permission (microphone) -> question (chat) -> result (report). The public Navbar / Footer are
// hidden on this route (components/layout/chrome-visibility.js), so the page draws its own header.
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InterviewConfirmDialog from "../../components/interview/InterviewConfirmDialog";
import InterviewHeader from "../../components/interview/InterviewHeader";
import InterviewPermissionScreen from "../../components/interview/InterviewPermissionScreen";
import InterviewQuestionScreen from "../../components/interview/InterviewQuestionScreen";
import InterviewResultScreen from "../../components/interview/InterviewResultScreen";
import InterviewSetupScreen from "../../components/interview/InterviewSetupScreen";
import { INTERVIEW_ROLES } from "../../components/interview/interview-constants";
import { Button, EmptyState } from "../../components/ui";
import useAuth from "../../hooks/useAuth";
import useInterviewSession from "../../hooks/useInterviewSession";
import useInterviewSetup from "../../hooks/useInterviewSetup";

/** One interview visit. Remounted (key) for "New interview", which resets every hook and releases the devices. */
const InterviewRun = ({ onRestart }) => {
  const { t } = useTranslation("interview");
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleUnauthorized = useCallback(() => {
    // The login is no longer accepted (expired / revoked): full logout (token, user, axios header), then log in
    // again and come back here.
    logout();
    navigate("/login", { state: { from: location }, replace: true });
  }, [logout, navigate, location]);

  // Browser tab title in the active language.
  const documentTitle = t("page.documentTitle");
  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  const session = useInterviewSession({ onUnauthorized: handleUnauthorized });
  const setup = useInterviewSetup({
    jobId: searchParams.get("jobId"),
    active: session.screen === "setup",
    onReady: session.begin,
    onUnauthorized: handleUnauthorized,
  });


  const { screen } = session;
  return (
    <div className="min-h-screen bg-canvas" data-testid="interview-page" data-screen={screen}>
      <InterviewHeader
        remainingSeconds={session.remainingSeconds}
        canLeave={screen !== "question"}
      />
      <div className="relative mx-auto max-w-[1036px] px-5 pb-32 pt-10 sm:pt-16">
        {screen === "setup" && <InterviewSetupScreen setup={setup} startError={session.startError} />}
        {screen === "permission" && (
          <InterviewPermissionScreen
            voice={session.voice}
            status={session.permissionStatus}
            onEnableMic={session.enableMic}
            onBack={session.backToSetup}
            onStart={session.startInterview}
          />
        )}
        {screen === "question" && <InterviewQuestionScreen session={session} />}
        {screen === "result" && (
          <InterviewResultScreen result={session.result} onRetry={session.retryResult} onRestart={onRestart} />
        )}
      </div>
      <InterviewConfirmDialog request={session.confirm.request} onSettle={session.confirm.settle} />
    </div>
  );
};

/** Candidates and admins only (the interview API rejects other roles); a friendly page for everyone else. */
const InterviewPage = () => {
  const { t } = useTranslation("interview");
  const { user } = useAuth();
  const [runId, setRunId] = useState(0);

  if (user && !INTERVIEW_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-canvas">
        <InterviewHeader />
        <div className="mx-auto max-w-2xl px-5 py-16">
          <EmptyState
            title={t("forbidden.title")}
            description={t("forbidden.text")}
            action={
              <Button as={Link} to="/">
                {t("forbidden.home")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  return <InterviewRun key={runId} onRestart={() => setRunId((id) => id + 1)} />;
};

export default InterviewPage;
