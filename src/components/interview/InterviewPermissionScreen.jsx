import { FiActivity, FiMic } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, PageHeader } from "../ui";
import InterviewStatusLine from "./InterviewStatusLine";
import InterviewSwitchRow from "./InterviewSwitchRow";

const SERVICE_TEXT_KEYS = {
  unchecked: "permission.serviceUnchecked",
  checking: "permission.serviceChecking",
  ok: "permission.serviceReady",
  down: "permission.serviceDown",
};

/**
 * Step 2: microphone permission and voice-service health. Both are optional: without them the interview
 * runs in typing mode, so "Start" is always available.
 */
const InterviewPermissionScreen = ({ voice, status, onEnableMic, onBack, onStart }) => {
  const { t } = useTranslation("interview");
  const voiceReady = voice.micOn && voice.serviceOk;

  return (
    <section aria-label={t("permission.title")} data-testid="interview-permission">
      <PageHeader
        align="center"
        title={t("permission.title")}
        subtitle={t("permission.lead")}
        className="mb-10 sm:mb-14"
      />
      <div className="mx-auto flex w-full max-w-[500px] flex-col gap-8">
        <InterviewSwitchRow
          testId="interview-mic"
          icon={<FiMic />}
          title={t("permission.micTitle")}
          description={t("permission.micText")}
          checked={voice.micOn}
          onToggle={onEnableMic}
          switchLabel={t("permission.micSwitch")}
        />
        <InterviewSwitchRow
          testId="interview-service"
          icon={<FiActivity />}
          title={t("permission.serviceTitle")}
          description={t(SERVICE_TEXT_KEYS[voice.serviceState])}
          checked={voice.serviceOk}
          onToggle={voice.checkService}
          switchLabel={t("permission.serviceSwitch")}
        />
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button variant="outline" data-testid="interview-perm-back" onClick={onBack}>
          {t("permission.back")}
        </Button>
        <Button data-testid="interview-perm-start" onClick={onStart}>
          {voiceReady ? t("permission.startVoice") : t("permission.startTyping")}
        </Button>
      </div>
      <InterviewStatusLine status={status} center className="mt-3" />
    </section>
  );
};

export default InterviewPermissionScreen;
