// Setup form of the interview (track, level, duration, CV, JD) plus the things around it: today's quota and
// the optional FSD job (?jobId=...) that prefills the JD. submit() parses the CV / JD with ai-service, loads the
// STT phrases and hands the finished configuration to onReady().
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_DURATION, DEFAULT_LEVEL } from "../components/interview/interview-constants";
import { guessTrackFromJob } from "../components/interview/guess-track-from-job";
import { describeInterviewError, isUnauthorized } from "../services/interviewErrors";
import {
  fetchJob,
  fetchQuota,
  fetchSttPhrases,
  parseCv,
  parseJd,
} from "../services/interviewService";

const JOB_ID_PATTERN = /^[0-9a-f-]{36}$/i; // same check as interview-service before it stores job_id

/** Text put in the JD box for a job: title, description, requirements. */
const composeJobDescription = (job, requirementsHeading) =>
  [job.title, job.description, job.requirements && `${requirementsHeading}\n${job.requirements}`]
    .filter(Boolean)
    .join("\n\n");

/**
 * @param {{jobId: string|null, active: boolean, onReady: Function, onUnauthorized: Function}} options
 *   active = the setup screen is showing (quota is re-read every time the user comes back to it)
 */
export default function useInterviewSetup({ jobId, active, onReady, onUnauthorized }) {
  const { t } = useTranslation("interview");
  const [track, setTrack] = useState("");
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [cvFile, setCvFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [job, setJob] = useState(null);
  const [jobState, setJobState] = useState(() => {
    if (!jobId) return "none";
    return JOB_ID_PATTERN.test(jobId) ? "loading" : "failed";
  }); // none | loading | ready | failed
  const [quota, setQuota] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Job from the link: prefill the JD and guess the track (both stay editable).
  const requirementsHeading = t("setup.jobRequirements");
  useEffect(() => {
    if (!jobId || !JOB_ID_PATTERN.test(jobId)) return undefined;
    const controller = new AbortController();
    fetchJob(jobId, controller.signal)
      .then((data) => {
        setJob(data);
        setJdText(composeJobDescription(data, requirementsHeading));
        setTrack((current) => current || guessTrackFromJob(data));
        setJobState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setJobState("failed");
      });
    return () => controller.abort();
    // The heading is read once per job load; a later language switch must not overwrite what the user edited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Quota: shown on the setup screen; an expired token is noticed here first.
  useEffect(() => {
    if (!active) return undefined;
    const controller = new AbortController();
    fetchQuota(controller.signal)
      .then(setQuota)
      .catch((error) => {
        if (isUnauthorized(error)) onUnauthorized();
      });
    return () => controller.abort();
  }, [active, onUnauthorized]);

  const quotaExhausted = quota !== null && quota.remaining <= 0;

  const submit = useCallback(async () => {
    if (!track) {
      setStatus({ key: "setup.pickTrack", tone: "warn" });
      return;
    }
    if (quotaExhausted) {
      setStatus({ key: "errors.quotaExceeded", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      let cv = null;
      let jd = null;
      if (cvFile) {
        setStatus({ key: "setup.parsingCv" });
        cv = await parseCv(cvFile, track);
      }
      if (jdText.trim()) {
        setStatus({ key: "setup.parsingJd" });
        jd = await parseJd(track, jdText.trim());
      }
      const phrases = await fetchSttPhrases(track);
      setStatus(null);
      onReady({
        track,
        level,
        duration,
        cv,
        jd,
        phrases,
        jobId: jobState === "ready" ? job.id : null,
      });
    } catch (error) {
      if (isUnauthorized(error)) onUnauthorized();
      else setStatus(describeInterviewError(error));
    } finally {
      setSubmitting(false);
    }
  }, [track, quotaExhausted, cvFile, jdText, level, duration, jobState, job, onReady, onUnauthorized]);

  return {
    track,
    setTrack,
    level,
    setLevel,
    duration,
    setDuration,
    cvFile,
    setCvFile,
    jdText,
    setJdText,
    job,
    jobState,
    quota,
    quotaExhausted,
    status,
    submitting,
    submit,
  };
}
