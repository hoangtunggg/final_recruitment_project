import { expect, test } from "@playwright/test";
import { API_URL, registerUser, signInWithToken } from "./support/test-users.js";
import { deleteJob } from "./support/test-jobs.js";

/**
 * AI interview page against the LIVE backend (real LLM, real voice-service health; nothing is mocked).
 * Run:  npx playwright test e2e/interview.spec.js
 *
 * Data: one employer posts a "Python Backend Developer" job, candidates open /interview?jobId=<id>.
 * Voice: only the voice-service health and the presence of the voice controls are checked; no audio is recorded
 * (the headless browser has no microphone, so the interview runs in typing mode, as in production without a mic).
 * Selectors use test ids so the tests do not depend on the copy language, except the language-switch test.
 */
const JOB = {
  title: "Python Backend Developer",
  company: "E2E Test Company",
  location: "Ho Chi Minh City",
  description:
    "Build and maintain REST APIs with Django and FastAPI, design PostgreSQL schemas and work with Redis caching.",
  requirements: "2+ years of Python, SQL and Docker; experience with automated testing.",
  type: "Full-time",
  experience: "Mid Level",
};

const LLM_TIMEOUT = 90_000; // a streamed question or a report from the real model

let jobId;
let employer;

test.beforeAll(async ({ request }) => {
  employer = await registerUser(request, { role: "employer", name: "E2E Employer" });
  const response = await request.post(`${API_URL}/api/jobs`, {
    headers: { Authorization: `Bearer ${employer.token}` },
    data: JOB,
  });
  expect(response.ok(), `create job failed: ${response.status()} ${await response.text()}`).toBe(true);
  jobId = (await response.json()).data.id;
  expect(jobId).toBeTruthy();
});

// Keep the shared staging DB clean: the job is only needed while this file runs.
test.afterAll(async ({ request }) => {
  if (jobId) await deleteJob(request, employer, jobId);
});

/** Registers a candidate and opens /interview?jobId=<job>. */
async function openInterviewAsCandidate(page, request) {
  const candidate = await registerUser(request, { name: "E2E Candidate" });
  await signInWithToken(page, candidate, `/interview?jobId=${jobId}`);
  await expect(page.getByTestId("interview-setup")).toBeVisible();
  return candidate;
}

/** Setup -> permission -> first question, in typing mode. Resolves once the first question has fully streamed. */
async function startTextInterview(page) {
  await page.getByTestId("interview-setup-next").click(); // parses the prefilled JD with ai-service
  await expect(page.getByTestId("interview-permission")).toBeVisible({ timeout: LLM_TIMEOUT });
  await page.getByTestId("interview-perm-start").click();
  await expect(page.getByTestId("interview-msg-ai").first()).toBeVisible({ timeout: LLM_TIMEOUT });
  await expect(page.getByTestId("interview-chat")).toHaveAttribute("aria-busy", "false", { timeout: LLM_TIMEOUT });
  await expect(page.getByTestId("interview-answer")).toBeEnabled({ timeout: LLM_TIMEOUT });
}

test.describe("AI interview page", () => {
  test("setup shows the job, prefilled JD, guessed track and quota; EN toggle re-labels the form", async ({
    page,
    request,
  }) => {
    await openInterviewAsCandidate(page, request);

    // Job from ?jobId: title shown, JD prefilled with title + description + requirements, track guessed.
    await expect(page.getByTestId("interview-job-title")).toHaveText(JOB.title);
    const jd = page.getByTestId("interview-jd");
    await expect(jd).toHaveValue(new RegExp(JOB.title));
    await expect(jd).toHaveValue(/Django and FastAPI/);
    await expect(jd).toHaveValue(/2\+ years of Python/);
    await expect(page.getByTestId("interview-track")).toHaveValue("python_backend");

    // Quota of a fresh account: "<remaining>/<limit>" with nothing used yet.
    const quota = page.getByTestId("interview-quota");
    await expect(quota).toBeVisible();
    await expect(quota).toContainText(/(\d+)\/\1/);
    await expect(quota).toContainText("Hôm nay bạn còn");

    // Default language is Vietnamese; switching to EN changes the labels (and keeps what was typed).
    await expect(page.getByRole("heading", { name: "Thiết lập buổi phỏng vấn" })).toBeVisible();
    await page.getByTestId("lang-en").filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: "Set up your interview" })).toBeVisible();
    await expect(page.getByLabel("Role", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Level", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Job description", { exact: true })).toHaveValue(/Python Backend Developer/);
    await expect(page.getByTestId("interview-setup-next")).toHaveText("Continue");
    await expect(quota).toContainText("practice interviews left today");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("interview-track").locator("option:checked")).toHaveText("Python Backend");

    await page.getByTestId("lang-vi").filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: "Thiết lập buổi phỏng vấn" })).toBeVisible();
  });

  test("voice mode: permission screen has the mic control and voice-service health is OK", async ({
    page,
    request,
  }) => {
    await openInterviewAsCandidate(page, request);
    await page.getByTestId("interview-jd").fill(""); // no JD -> no LLM call just to reach this screen
    await page.getByTestId("interview-setup-next").click();

    await expect(page.getByTestId("interview-permission")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("interview-mic-switch")).toBeVisible(); // voice-mode control
    await expect(page.getByTestId("interview-mic-switch")).toHaveAttribute("aria-checked", "false");
    // Voice-service health (GET interviews/voice/health): provider ok -> the switch turns on.
    await expect(page.getByTestId("interview-service-switch")).toHaveAttribute("aria-checked", "true", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("interview-service-text")).toHaveText("Sẵn sàng");
    // Without a microphone the interview still starts, by typing.
    await expect(page.getByTestId("interview-perm-start")).toHaveText("Bắt đầu (trả lời bằng chữ)");
  });

  test("candidate answers one question by typing, then ends the interview and sees the report", async ({
    page,
    request,
  }) => {
    test.setTimeout(360_000);
    const candidate = await openInterviewAsCandidate(page, request);
    await startTextInterview(page);

    // The first question rendered, with a topic counter and a running countdown.
    const questions = page.getByTestId("interview-msg-ai");
    expect((await questions.first().innerText()).length).toBeGreaterThan(20);
    await expect(page.getByTestId("interview-progress-count")).toContainText("1/");
    await expect(page.getByTestId("interview-timer")).toHaveText(/^\d\d:\d\d$/);

    // One typed answer -> a bubble from the candidate -> the next question or a follow-up from the AI.
    await page
      .getByTestId("interview-answer")
      .fill("Tôi dùng Django REST Framework với PostgreSQL, thêm index cho cột hay lọc và cache bằng Redis.");
    await page.getByTestId("interview-send").click();
    await expect(page.getByTestId("interview-msg-me")).toHaveCount(1);
    await expect(questions).toHaveCount(2, { timeout: LLM_TIMEOUT });
    await expect(page.getByTestId("interview-chat")).toHaveAttribute("aria-busy", "false", { timeout: LLM_TIMEOUT });
    expect((await questions.nth(1).innerText()).length).toBeGreaterThan(20);

    // The session counted against today's quota.
    const quotaResponse = await request.get(`${API_URL}/api/interviews/quota`, {
      headers: { Authorization: `Bearer ${candidate.token}` },
    });
    expect((await quotaResponse.json()).data.used).toBe(1);

    // Hard stop with confirmation -> result screen -> report from /finalize.
    await page.getByTestId("interview-end").click();
    await expect(page.getByTestId("interview-confirm")).toBeVisible();
    await page.getByTestId("interview-confirm-ok").click();
    await expect(page.getByTestId("interview-result")).toBeVisible();
    await expect(page.getByTestId("interview-report")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId("interview-score")).toContainText("/10");
    await expect(page.getByTestId("interview-result-status")).toContainText("1");
  });

  test("saying 'stop the interview' asks to confirm and ends with no feedback when nothing was answered", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    await openInterviewAsCandidate(page, request);
    await startTextInterview(page);

    await page.getByTestId("interview-answer").fill("Dừng phỏng vấn");
    await page.getByTestId("interview-send").click();
    await expect(page.getByTestId("interview-confirm")).toBeVisible();
    await page.getByTestId("interview-confirm-ok").click();

    await expect(page.getByTestId("interview-result")).toBeVisible();
    await expect(page.getByTestId("interview-result-status")).toContainText("chưa có đánh giá");
    await expect(page.getByTestId("interview-report")).toHaveCount(0);
    // "Buổi mới" resets to the setup screen without a reload.
    await page.getByTestId("interview-restart").click();
    await expect(page.getByTestId("interview-setup")).toBeVisible();
  });

  test("an employer sees a friendly 'candidates only' page instead of the interview", async ({ page }) => {
    await signInWithToken(page, employer, "/interview");
    await expect(page.getByRole("heading", { name: "Tính năng dành cho ứng viên" })).toBeVisible();
    await expect(page.getByTestId("interview-setup")).toHaveCount(0);
  });
});
