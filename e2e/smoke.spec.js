import { expect, test } from "@playwright/test";
import { registerUser } from "./support/test-users.js";

// Language-agnostic selectors: ids / test ids / types, so copy changes do not break the smoke test.
// The navbar renders one language toggle for desktop and one for mobile (CSS hides one), hence `visible`.
const visible = (page, testId) => page.getByTestId(testId).filter({ visible: true });

test.describe("smoke", () => {
  test("home page loads with the shared navbar and footer in Vietnamese by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("navbar")).toBeVisible();
    await expect(page.getByTestId("footer")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.getByTestId("nav-home")).toHaveText("Trang chủ");
  });

  test("language toggle switches VI <-> EN, updates <html lang> and persists", async ({ page }) => {
    await page.goto("/");
    const home = page.getByTestId("nav-home");
    await expect(home).toHaveText("Trang chủ");

    await visible(page, "lang-en").click();
    await expect(home).toHaveText("Home");
    await expect(page.getByTestId("nav-browse")).toHaveText("Browse Jobs");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await page.evaluate(() => localStorage.getItem("lang"))).toBe("en");

    await page.reload();
    await expect(page.getByTestId("nav-home")).toHaveText("Home");

    await visible(page, "lang-vi").click();
    await expect(page.getByTestId("nav-home")).toHaveText("Trang chủ");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("registered candidate can log in through the UI and sees the AI Interview entry", async ({
    page,
    request,
  }) => {
    const user = await registerUser(request);

    await page.goto("/login");
    await page.locator("input[type=email]").fill(user.email);
    await page.locator("input[type=password]").fill(user.password);
    await page.locator("button[type=submit]").click();

    // Candidates land on the public home page; the token proves the login worked.
    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(() => page.evaluate(() => Boolean(localStorage.getItem("token"))))
      .toBe(true);

    const interviewLink = page.getByTestId("nav-interview");
    await expect(interviewLink).toBeVisible();
    await expect(interviewLink).toHaveAttribute("href", "/interview");
    await expect(interviewLink).toHaveText("Phỏng vấn AI");
  });
});
