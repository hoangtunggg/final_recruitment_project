// Endpoint-level calls of the AI interview page. Paths map 1:1 to the AI repo's page:
//   /api/<x> -> ${API_URL}/interviews/ai/<x>      /dev/voice/<x> -> ${API_URL}/interviews/voice/<x>
import {
  aiUrl,
  getJson,
  jobUrl,
  postForBlob,
  postForm,
  postJson,
  postSse,
  quotaUrl,
  voiceUrl,
} from "./interviewApiClient";

/** Daily quota of the signed-in user: {limit, used, remaining}. */
export const fetchQuota = async (signal) => (await getJson(quotaUrl(), signal)).data;

/** A FSD job (public endpoint) used to prefill the JD: {id, title, description, requirements, skills ...}. */
export const fetchJob = async (jobId, signal) => (await getJson(jobUrl(jobId), signal)).data;

export const parseCv = async (file, track) => {
  const form = new FormData();
  form.append("file", file);
  form.append("track", track);
  return (await postForm(aiUrl("cv/parse"), form)).cv_profile;
};

export const parseJd = async (track, jdText) =>
  (await postJson(aiUrl("jd/parse"), { track, jd_text: jdText })).jd_profile;

/** STT hint terms for a track. Failure is harmless (transcripts are just a bit worse), so it returns []. */
export const fetchSttPhrases = async (track) => {
  try {
    return (await getJson(aiUrl(`stt/phrases?track=${encodeURIComponent(track)}`))).phrases || [];
  } catch {
    return [];
  }
};

/** First question. SSE events: meta, token, replace, done. Resolves with the `done` payload. */
export const startInterviewStream = (body, onEvent, signal) =>
  postSse(aiUrl("start"), body, onEvent, signal);

/** Evaluate an answer and stream the next question. */
export const nextTurnStream = (body, onEvent, signal) =>
  postSse(aiUrl("next-turn"), body, onEvent, signal);

export const finalizeInterview = (body) => postJson(aiUrl("finalize"), body);

/** Voice-service health: {status: "ok", provider: "blaze"} when TTS/STT are usable. Never throws. */
export const fetchVoiceHealth = async () => {
  try {
    return await getJson(voiceUrl("health"));
  } catch (error) {
    return { status: "error", provider: null, message: error.message };
  }
};

/** Voice is usable only when the provider reports ok and is the real one. */
export const isVoiceHealthy = (health) => health?.status === "ok" && health?.provider === "blaze";

/** TTS of one question as an audio Blob (audio/mpeg). */
export const fetchSpeech = (text, signal) => postForBlob(voiceUrl("speak"), { text }, signal);

/**
 * STT of a whole recording (contract 015). Consent is implicit: enabling the mic is the consent step.
 * Returns {transcript, no_speech, metrics}.
 */
export const transcribeRecording = ({ blob, phrases, questionEndedAt, recordingStartedAt, topicId }) => {
  const form = new FormData();
  form.append("audio", blob, blob.type.includes("ogg") ? "answer.ogg" : "answer.webm");
  form.append("consent_confirmed", "true");
  for (const phrase of phrases) form.append("keywords", phrase);
  if (questionEndedAt) form.append("question_audio_ended_at", String(questionEndedAt));
  form.append("recording_started_at", String(recordingStartedAt));
  if (topicId) form.append("topic_id", topicId.slice(0, 64));
  form.append("language", "vi");
  return postForm(voiceUrl("transcribe"), form);
};

export const fetchVoiceSummary = (turns) => postJson(voiceUrl("session-summary"), { turns });
