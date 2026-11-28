import { expect, test } from "@playwright/test";

// Dedicated staging admin account (test only). Real backend, no mocked responses.
// Staging admin test account: credentials come from the environment, never from the repo.
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
test.skip(!ADMIN.email || !ADMIN.password, "set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin specs");

// Language-agnostic selectors (test ids / urls); copy is only asserted where the language switch is the point.
const visible = (page, testId) => page.getByTestId(testId).filter({ visible: true });

test.describe("admin area", () => {
  test("admin logs in, sees the sidebar in Vietnamese, switches to English and opens jobs, users, applications", async ({
    page,
  }) => {
    // Attached before navigation so nothing is missed; not filtered: a backend-caused error is a finding.
    const consoleErrors = [];
    page.on("console", (message) => {
      // `[i18n] missing ...` warnings (dev build) mean a key is absent in the active language: fail on them too.
      if (message.type() === "error" || message.text().includes("[i18n] missing")) {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

    await test.step("log in through the UI (lands on /admin)", async () => {
      await page.goto("/login");
      await page.locator("input[type=email]").fill(ADMIN.email);
      await page.locator("input[type=password]").fill(ADMIN.password);
      await page.locator("button[type=submit]").click();
      await expect
        .poll(() => page.evaluate(() => Boolean(localStorage.getItem("token"))))
        .toBe(true);
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/?$/);
    });

    const sidebar = page.getByTestId("admin-sidebar");
    await expect(sidebar).toBeVisible();

    await test.step("sidebar is Vietnamese by default", async () => {
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      await expect(page.getByTestId("admin-nav-dashboard")).toHaveText("Tổng quan");
      await expect(page.getByTestId("admin-nav-group-jobs")).toContainText("Quản lý việc làm");
      await expect(page.getByTestId("admin-nav-group-users")).toContainText("Quản lý người dùng");
      await expect(page.getByTestId("admin-nav-applications")).toHaveText("Quản lý đơn ứng tuyển");
      await expect(page.getByTestId("admin-nav-settings")).toHaveText("Cài đặt hệ thống");
    });

    await test.step("switching to English changes the labels", async () => {
      await visible(page, "lang-en").click();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByTestId("admin-nav-dashboard")).toHaveText("Dashboard");
      await expect(page.getByTestId("admin-nav-group-jobs")).toContainText("Job management");
      await expect(page.getByTestId("admin-nav-group-users")).toContainText("User management");
      await expect(page.getByTestId("admin-nav-applications")).toHaveText("Application management");
      await expect(page.getByTestId("admin-nav-settings")).toHaveText("System settings");
    });

    await test.step("jobs page opens", async () => {
      await page.getByTestId("admin-nav-group-jobs").click();
      await page.getByTestId("admin-nav-jobs").click();
      await expect(page).toHaveURL(/\/admin\/jobs$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Job moderation & management");
    });

    await test.step("users page opens and lists the admin account", async () => {
      await page.getByTestId("admin-nav-group-users").click();
      await page.getByTestId("admin-nav-users").click();
      await expect(page).toHaveURL(/\/admin\/users$/);
      // Smoke runs keep registering users and the table paginates: narrow it with the page search box.
      await page.getByTestId("admin-users-search").fill(ADMIN.email);
      await expect(
        page.getByTestId("admin-users-table").getByText(ADMIN.email, { exact: true })
      ).toBeVisible();
    });

    await test.step("applications page opens", async () => {
      await page.getByTestId("admin-nav-applications").click();
      await expect(page).toHaveURL(/\/admin\/applications$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Application moderation & tracking");
    });

    await test.step("back to Vietnamese keeps the page translated", async () => {
      await visible(page, "lang-vi").click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kiểm duyệt & theo dõi đơn ứng tuyển");
    });

    expect(consoleErrors, `console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });
});
