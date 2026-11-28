import { expect, test } from "@playwright/test";
import { registerUser, signInWithToken, uniqueEmail, TEST_PASSWORD } from "./support/test-users.js";
import { createJob, deleteJob } from "./support/test-jobs.js";

// The navbar renders the language toggle twice (desktop + mobile), hence `visible`.
const visible = (page, testId) => page.getByTestId(testId).filter({ visible: true });

/** Collects console errors, page errors and missing-translation warnings so a test can assert there are none. */
function watchConsole(page) {
  const problems = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") problems.push(`console.error: ${text}`);
    if (message.type() === "warning" && text.includes("[i18n] missing")) problems.push(`i18n: ${text}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

const hasHorizontalOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.describe("candidate: home", () => {
  test("hero and search render in Vietnamese and switch to English", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/");
    const hero = page.getByTestId("home-hero");
    await expect(hero).toBeVisible();
    await expect(hero.getByRole("heading", { level: 1 })).toContainText("luyện phỏng vấn cùng AI");
    await expect(page.getByTestId("home-search-input")).toHaveAttribute("placeholder", /Chức danh/);
    await expect(page.getByTestId("home-search-submit")).toContainText("Tìm việc");
    // The AI-interview promo block links to the interview page.
    await expect(page.getByTestId("home-interview-cta")).toHaveAttribute("href", "/interview");

    await visible(page, "lang-en").click();
    await expect(hero.getByRole("heading", { level: 1 })).toContainText("practise interviews with AI");
    await expect(page.getByTestId("home-search-input")).toHaveAttribute("placeholder", /Job title/);
    await expect(page.getByTestId("home-search-submit")).toContainText("Search jobs");
    expect(problems).toEqual([]);
  });

  test("search submits into the URL and keeps the browse section visible", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-search-input").fill("react");
    await page.getByTestId("home-search-submit").click();
    await expect(page).toHaveURL(/search=react/);
    await expect(page.getByTestId("browse-jobs")).toBeVisible();
  });
});

test.describe("candidate: auth and dashboard", () => {
  test("a new candidate can register through the UI and lands on the dashboard", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#name").fill("E2E Candidate");
    await page.locator("#email").fill(uniqueEmail("e2e-ui"));
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.locator("#confirmPassword").fill(TEST_PASSWORD);
    await page.locator("button[type=submit]").click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("candidate-dashboard")).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("token")))).toBe(true);
  });

  test("register form shows translated validation errors", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#name").fill("E2E");
    await page.locator("#email").fill("no-at-sign");
    await page.locator("#password").fill("123");
    await page.locator("#confirmPassword").fill("456");
    await page.locator("button[type=submit]").click();
    await expect(page.getByText("Email phải có ký tự")).toBeVisible();
    await expect(page.getByText("Mật khẩu cần có ít nhất 6 ký tự")).toBeVisible();
    await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible();
  });

  // One account serves the login test and the dashboard test (the gateway rate-limits registrations).
  test.describe("with an existing candidate", () => {
    test.describe.configure({ mode: "serial" });
    let user;

    test.beforeAll(async ({ playwright }) => {
      const request = await playwright.request.newContext();
      user = await registerUser(request);
      await request.dispose();
    });

    test("login through the UI: a wrong password shows a translated error, the right one signs in", async ({ page }) => {
      await page.goto("/login");
      await page.locator("input[type=email]").fill(user.email);
      await page.locator("input[type=password]").fill("wrong-password-1");
      await page.locator("button[type=submit]").click();
      await expect(page.getByRole("alert").filter({ hasText: "Email hoặc mật khẩu không đúng" })).toBeVisible();
      // The typed email survives the failed attempt.
      await expect(page.locator("input[type=email]")).toHaveValue(user.email);

      await page.locator("input[type=password]").fill(user.password);
      await page.locator("button[type=submit]").click();
      await expect(page).toHaveURL(/\/$/);
      await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("token")))).toBe(true);
    });

    test("dashboard tabs render without console errors and expose the AI interview entry", async ({ page }) => {
      const problems = watchConsole(page);
      await signInWithToken(page, user, "/dashboard");

      await expect(page.getByTestId("candidate-dashboard")).toBeVisible();
      await expect(page.getByTestId("dashboard-header")).toBeVisible();
      await expect(page.locator("#dashboard-panel-overview")).toBeVisible();

      // AI interview entries: header tab bar + welcome banner (both point at /interview).
      await expect(page.getByTestId("main-dashboard-interview-link")).toHaveAttribute("href", "/interview");
      await expect(page.getByTestId("dashboard-interview-cta")).toHaveAttribute("href", "/interview");

      for (const tab of ["applications", "saved", "recommended", "resumes", "overview"]) {
        await page.locator(`#main-dashboard-tab-${tab}`).click();
        await expect(page.locator(`#dashboard-panel-${tab}`)).toBeVisible();
      }

      // Language switch re-renders the dashboard in English.
      await visible(page, "lang-en").click();
      await expect(page.locator("#main-dashboard-tab-applications")).toContainText("Applications");
      await expect(page.locator("#main-dashboard-interview-link")).toContainText("AI interview");
      expect(problems).toEqual([]);
    });
  });
});

// One employer + one job (created through the real API, removed afterwards) shared by every job test:
// the staging gateway rate-limits registrations, so fixtures are created once per run.
test.describe("candidate: job detail and mobile", () => {
  test.describe.configure({ mode: "serial" });
  let employer;
  let job;

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    employer = await registerUser(request, { role: "employer", name: "E2E Employer" });
    job = await createJob(request, employer);
    await request.dispose();
  });

  test.afterAll(async ({ playwright }) => {
    if (!job) return;
    const request = await playwright.request.newContext();
    await deleteJob(request, employer, job.id);
    await request.dispose();
  });

  test("detail page shows the job and the AI interview button links to /interview?jobId=<id>", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto(`/jobs/${job.id}`);

    await expect(page.getByTestId("job-detail")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(job.title);

    const cta = page.getByTestId("job-ai-interview-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", `/interview?jobId=${job.id}`);
    await expect(cta).toContainText("Luyện phỏng vấn AI cho vị trí này");

    await visible(page, "lang-en").click();
    await expect(cta).toContainText("Practise an AI interview for this job");
    expect(problems).toEqual([]);
  });

  test("anonymous visitors who click the AI interview button are sent to login (/interview is protected)", async ({ page }) => {
    await page.goto(`/jobs/${job.id}`);
    await page.getByTestId("job-ai-interview-cta").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("applying while logged out redirects to login with a return path", async ({ page }) => {
    await page.goto(`/jobs/${job.id}`);
    await page.getByTestId("job-apply-button").click();
    await expect(page).toHaveURL(new RegExp(`/login\\?redirect=/jobs/${job.id}`));
  });

  test("the job appears in the home listing", async ({ page }) => {
    await page.goto(`/?search=${encodeURIComponent(job.title)}`);
    await expect(page.getByTestId("job-card").filter({ hasText: job.title })).toHaveCount(1);
  });

  test.describe("mobile 390px", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("home has no horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByTestId("home-hero")).toBeVisible();
      await page.getByTestId("browse-jobs").scrollIntoViewIfNeeded();
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });

    test("job detail has no horizontal overflow", async ({ page }) => {
      await page.goto(`/jobs/${job.id}`);
      await expect(page.getByTestId("job-ai-interview-cta")).toBeVisible();
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });

    test("login and register have no horizontal overflow", async ({ page }) => {
      for (const path of ["/login", "/register"]) {
        await page.goto(path);
        await expect(page.locator("button[type=submit]")).toBeVisible();
        expect(await hasHorizontalOverflow(page)).toBe(false);
      }
    });
  });
});
