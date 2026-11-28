import { expect, test } from "@playwright/test";
import { API_URL, registerUser } from "./support/test-users.js";

// Employer area against the live backend (no mocks). Selectors use test ids / field names so they work in VI and EN.
const visible = (page, testId) => page.getByTestId(testId).filter({ visible: true });

/** Remove the jobs this test created so the shared database stays clean. */
async function deleteOwnJobs(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const list = await request.get(`${API_URL}/api/jobs/my-jobs`, { headers });
  if (!list.ok()) return;
  for (const job of (await list.json()).data || []) {
    await request.delete(`${API_URL}/api/jobs/${job.id}`, { headers });
  }
}

test.describe("employer area", () => {
  test("dashboard in Vietnamese, EN switch, post a job and see it in manage jobs", async ({ page, request }) => {
    const employer = await registerUser(request, { role: "employer", name: "E2E Employer" });
    const consoleErrors = [];
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    try {
      // Sign in through the real login form; employers are redirected to /employer
      await page.goto("/login");
      await page.locator("input[type=email]").fill(employer.email);
      await page.locator("input[type=password]").fill(employer.password);
      await page.locator("button[type=submit]").click();
      await expect(page).toHaveURL(/\/employer\/?$/);

      // Dashboard renders in Vietnamese (default language) with the themed layout
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      await expect(page.locator("#employer-main-content h1")).toHaveText("Bảng điều khiển nhà tuyển dụng");
      await expect(page.getByTestId("employer-nav-overview")).toHaveText("Tổng quan");
      await expect(page.getByTestId("employer-nav-postJob")).toHaveText("Đăng tin");
      await expect(page.getByTestId("employer-nav-myJobs")).toHaveText("Tin tuyển dụng");
      // Brand 5-colour bar is rendered (TopBar)
      await expect(page.locator("span.bg-brand-red").first()).toBeAttached();
      // Empty account: the posting panel offers the first-job call to action, no raw English copy
      await expect(page.getByText("Chưa có tin tuyển dụng nào").first()).toBeVisible();
      await expect(page.getByText("No job postings yet")).toHaveCount(0);

      // Switch to English: sidebar labels change
      await visible(page, "lang-en").click();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByTestId("employer-nav-overview")).toHaveText("Overview");
      await expect(page.getByTestId("employer-nav-postJob")).toHaveText("Post job");
      await expect(page.getByTestId("employer-nav-myJobs")).toHaveText("My jobs");
      await expect(page.locator("#employer-main-content h1")).toHaveText("Employer dashboard");

      // Back to Vietnamese, then post a job through the UI form
      await visible(page, "lang-vi").click();
      await expect(page.getByTestId("employer-nav-overview")).toHaveText("Tổng quan");

      await page.getByTestId("employer-nav-postJob").click();
      await expect(page).toHaveURL(/\/employer\/post-job$/);
      await expect(page.locator("#employer-main-content h1")).toHaveText("Tạo tin tuyển dụng");

      // Validation messages are Vietnamese
      await page.getByTestId("job-form-submit").click();
      await expect(page.getByText("Vui lòng nhập chức danh.")).toBeVisible();

      const title = `E2E Kỹ sư kiểm thử ${Date.now()}`;
      await page.locator("input[name=title]").fill(title);
      await page.locator("input[name=location]").fill("Hà Nội");
      await page
        .locator("textarea[name=description]")
        .fill("Mô tả công việc dùng cho bài kiểm thử tự động của khu vực nhà tuyển dụng.");
      await page
        .locator("textarea[name=requirements]")
        .fill("Có kinh nghiệm kiểm thử phần mềm và viết kịch bản tự động.");
      await page.getByTestId("job-form-submit").click();

      await expect(page.getByTestId("job-form-success")).toBeVisible();
      await expect(page).toHaveURL(/\/employer\/jobs$/);

      // The new job is listed in Manage Jobs
      const row = page.getByTestId("employer-job-row").filter({ hasText: title });
      await expect(row).toBeVisible();
      await expect(row).toContainText("Toàn thời gian");

      expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
    } finally {
      await deleteOwnJobs(request, employer.token);
    }
  });
});
