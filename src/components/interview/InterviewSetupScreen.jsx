import { FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, PageHeader, Select, Textarea } from "../ui";
import InterviewCvPicker from "./InterviewCvPicker";
import InterviewJobBanner from "./InterviewJobBanner";
import InterviewQuotaNotice from "./InterviewQuotaNotice";
import InterviewStatusLine from "./InterviewStatusLine";
import { DURATIONS, LEVEL_IDS, TRACK_IDS } from "./interview-constants";

/**
 * Step 1: choose track, level and length, optionally attach a CV and paste (or arrive with) a JD.
 * `setup` = useInterviewSetup(); `startError` = why the last start failed (quota, upstream ...).
 */
const InterviewSetupScreen = ({ setup, startError }) => {
  const { t } = useTranslation("interview");
  const busy = setup.submitting;

  const handleSubmit = (event) => {
    event.preventDefault();
    setup.submit();
  };

  return (
    <section aria-labelledby="interview-setup-title" data-testid="interview-setup">
      <PageHeader
        align="center"
        title={t("page.title")}
        subtitle={t("page.lead")}
        className="mb-10 sm:mb-14"
      />
      <Card tone="tint" padding="lg" className="mx-auto w-full max-w-[600px]">
        <h2 id="interview-setup-title" className="mb-8 text-[28px] font-bold leading-9">
          {t("setup.title")}
        </h2>
        <InterviewJobBanner job={setup.job} state={setup.jobState} />
        <InterviewQuotaNotice quota={setup.quota} />
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label={t("setup.track")}
              data-testid="interview-track"
              value={setup.track}
              onChange={(event) => setup.setTrack(event.target.value)}
            >
              <option value="" disabled>
                {t("setup.trackPlaceholder")}
              </option>
              {TRACK_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`tracks.${id}`)}
                </option>
              ))}
            </Select>
            <Select
              label={t("setup.level")}
              data-testid="interview-level"
              value={setup.level}
              onChange={(event) => setup.setLevel(event.target.value)}
            >
              {LEVEL_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`levels.${id}`)}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label={t("setup.duration")}
            data-testid="interview-duration"
            value={setup.duration}
            onChange={(event) => setup.setDuration(Number(event.target.value))}
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t("setup.durationOption", { minutes })}
              </option>
            ))}
          </Select>
          <InterviewCvPicker file={setup.cvFile} onChange={setup.setCvFile} />
          <Textarea
            label={t("setup.jd")}
            hint={t("setup.jdHint")}
            data-testid="interview-jd"
            rows={setup.jobState === "ready" ? 8 : 3}
            placeholder={t("setup.jdPlaceholder")}
            value={setup.jdText}
            onChange={(event) => setup.setJdText(event.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              data-testid="interview-setup-next"
              loading={busy}
              disabled={setup.quotaExhausted || setup.jobState === "loading"}
              rightIcon={<FiArrowRight aria-hidden="true" />}
            >
              {t("setup.continue")}
            </Button>
          </div>
        </form>
        <InterviewStatusLine
          status={setup.status || startError}
          testId="interview-setup-status"
          className="mt-3"
        />
      </Card>
    </section>
  );
};

export default InterviewSetupScreen;
