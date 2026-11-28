import fs from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * Admin "ops" pages (dashboard, reports, notifications, settings, employer management)
 * against the live staging backend, logged in as the staging test admin through the UI.
 * Headings are read from the same adminOps dictionaries the app uses, so a missing or
 * untranslated title fails the test. Any console error or `[i18n] missing` warning fails it too.
 */
// Staging admin test account: credentials come from the environment, never from the repo.
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
test.skip(!ADMIN.email || !ADMIN.password, "set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin specs");

const PAGES = [
  { path: "/admin", key: ["dashboard", "title"] },
  { path: "/admin/reports", key: ["reports", "title"] },
  { path: "/admin/notifications", key: ["notifications", "title"] },
  { path: "/admin/settings", key: ["settings", "title"] },
  { path: "/admin/employers", key: ["employers", "title"] },
];

const dictionary = (lang, namespace = "adminOps") =>
  JSON.parse(
    fs.readFileSync(
      new URL(`../src/i18n/locales/${lang}/${namespace}.json`, import.meta.url),
      "utf8"
    )
  );

const collectProblems = (page) => {
  const problems = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") problems.push(`console.error: ${text}`);
    if (msg.type() === "warning" && text.includes("[i18n] missing")) problems.push(text);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
};

const loginAsAdmin = async (page) => {
  await page.goto("/login");
  await page.locator("input[type=email]").fill(ADMIN.email);
  await page.locator("input[type=password]").fill(ADMIN.password);
  await page.locator("button[type=submit]").click();
  await page.waitForURL("**/admin", { timeout: 30_000 });
};

for (const lang of ["vi", "en"]) {
  test(`admin ops pages render translated headings without console errors (${lang})`, async ({
    page,
  }) => {
    const problems = collectProblems(page);
    // Set the language before the app boots (the admin chrome owns the toggle, not this spec).
    await page.addInitScript((value) => localStorage.setItem("lang", value), lang);
    const dict = dictionary(lang);

    await loginAsAdmin(page);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);

    for (const { path, key } of PAGES) {
      await page.goto(path);
      const title = key.reduce((node, part) => node?.[part], dict);
      expect(title, `adminOps ${key.join(".")} missing in ${lang}`).toBeTruthy();
      await expect(
        page.getByRole("heading", { level: 1, name: title }).first(),
        `${path} heading (${lang})`
      ).toBeVisible({ timeout: 20_000 });
      await page.waitForLoadState("networkidle");
    }

    // Tabs and dialogs that the default view of each page does not render.
    await page.goto("/admin/reports");
    for (const label of Object.values(dict.reports.tabs)) {
      await page.getByTestId("reports-tabs").getByRole("button", { name: label }).click();
      await page.waitForLoadState("networkidle");
    }

    await page.goto("/admin/settings");
    const settingsTabs = page.getByRole("navigation", { name: dict.settings.tabsLabel });
    for (const label of Object.values(dict.settings.tabs)) {
      await settingsTabs.getByRole("button", { name: label, exact: true }).click();
    }

    await page.goto("/admin/employers");
    await page
      .getByRole("button", { name: dict.employers.table.viewAria.replace("{{name}}", "") })
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: dict.employers.details.ariaLabel })).toBeVisible();
    await page.getByRole("button", { name: dict.employers.details.close }).click();

    // Status and delete dialogs (Trans-rendered text): open, then cancel without changing anything.
    const cancel = dictionary(lang, "common").actions.cancel;
    const rowAction = (template) => page.getByRole("button", { name: template.replace("{{name}}", "") });
    await rowAction(dict.employers.table.statusAria).first().click();
    const statusDialog = page.getByRole("dialog", { name: dict.employers.statusModal.ariaLabel });
    await expect(statusDialog).toBeVisible();
    await statusDialog.getByRole("button", { name: cancel }).click();
    await rowAction(dict.employers.table.deleteAria).first().click();
    const deleteDialog = page.getByRole("dialog", { name: dict.employers.deleteModal.ariaLabel });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: cancel }).click();

    expect(problems).toEqual([]);
  });
}
