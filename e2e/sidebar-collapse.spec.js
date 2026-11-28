import { expect, test } from "@playwright/test";
import { registerUser, signInWithToken } from "./support/test-users.js";

// Desktop sidebar collapse (employer + admin) against the live backend, no mocks.
// Copy is asserted in Vietnamese (default language) because the labels ARE the point of the test.
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };

test.use({ viewport: { width: 1440, height: 900 } });

// The content column (parent of <main>) carries the `lg:pl-64` / `lg:pl-20` padding.
const contentPadding = (page, mainId) =>
  page.locator(`#${mainId}`).evaluate((main) => getComputedStyle(main.parentElement).paddingLeft);
const sidebarWidth = async (page, sidebarId) =>
  Math.round((await page.locator(`#${sidebarId}`).boundingBox()).width);
const savedState = (page, storageKey) =>
  page.evaluate((key) => localStorage.getItem(key), storageKey);

/** Collapse -> rail, reload keeps it, expand again. `area` describes one sidebar (admin or employer). */
async function exerciseCollapse(page, area) {
  const { sidebarId, mainId, storageKey, toggleId, navId, navLabel } = area;
  const toggle = page.getByTestId(toggleId);
  const nav = page.getByTestId(navId);
  const sidebar = page.locator(`#${sidebarId}`);

  await test.step("expanded by default: w-64, labels visible, padding 256px", async () => {
    await expect(nav).toHaveText(navLabel);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Thu gọn thanh bên");
    await expect.poll(() => sidebarWidth(page, sidebarId)).toBe(256);
    await expect.poll(() => contentPadding(page, mainId)).toBe("256px");
    // 44px touch target
    expect((await toggle.boundingBox()).height).toBeGreaterThanOrEqual(44);
  });

  await test.step("collapse: icon rail, labels become aria-label + title, padding 80px", async () => {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Mở rộng thanh bên");
    await expect(sidebar.getByText(navLabel)).toHaveCount(0);
    await expect(nav).toHaveAttribute("aria-label", navLabel);
    await expect(nav).toHaveAttribute("title", navLabel);
    await expect.poll(() => sidebarWidth(page, sidebarId)).toBe(80);
    await expect.poll(() => contentPadding(page, mainId)).toBe("80px");
    expect(await savedState(page, storageKey)).toBe("collapsed");
  });

  await test.step("reload keeps the rail", async () => {
    await page.reload();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toHaveAttribute("aria-label", navLabel);
    await expect.poll(() => sidebarWidth(page, sidebarId)).toBe(80);
    await expect.poll(() => contentPadding(page, mainId)).toBe("80px");
  });

  await test.step("expand again: labels back, padding 256px, state saved", async () => {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toHaveText(navLabel);
    await expect.poll(() => sidebarWidth(page, sidebarId)).toBe(256);
    await expect.poll(() => contentPadding(page, mainId)).toBe("256px");
    expect(await savedState(page, storageKey)).toBe("expanded");
  });
}

test.describe("sidebar collapse", () => {
  test("employer: collapse to rail, persists across reload, expands again", async ({ page, request }) => {
    const employer = await registerUser(request, { role: "employer", name: "E2E Employer" });
    await signInWithToken(page, employer, "/employer");
    await expect(page.getByTestId("employer-nav-overview")).toBeVisible();

    await exerciseCollapse(page, {
      sidebarId: "employer-navigation",
      mainId: "employer-main-content",
      storageKey: "sidebar:employer",
      toggleId: "employer-sidebar-collapse",
      navId: "employer-nav-overview",
      navLabel: "Tổng quan",
    });
  });

  test("employer: saved rail never shrinks the mobile drawer", async ({ page, request }) => {
    const employer = await registerUser(request, { role: "employer", name: "E2E Employer" });
    await signInWithToken(page, employer, "/employer");
    await page.evaluate(() => localStorage.setItem("sidebar:employer", "collapsed"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    await expect(page.getByTestId("employer-sidebar-collapse")).toBeHidden();
    await page.getByRole("button", { name: "Mở thanh bên" }).click();
    await expect(page.getByTestId("employer-nav-overview")).toHaveText("Tổng quan");
    await expect.poll(() => sidebarWidth(page, "employer-navigation")).toBe(256);

    await page.keyboard.press("Escape");
    await expect
      .poll(async () => (await page.locator("#employer-navigation").boundingBox()).x)
      .toBeLessThan(0);
  });

  test("admin: collapse to rail, group opens its first page, persists, expands again", async ({ page }) => {
    test.skip(!ADMIN.email || !ADMIN.password, "set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin specs");

    await page.goto("/login");
    await page.locator("input[type=email]").fill(ADMIN.email);
    await page.locator("input[type=password]").fill(ADMIN.password);
    await page.locator("button[type=submit]").click();
    await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem("token")))).toBe(true);
    await page.goto("/admin");
    await expect(page.getByTestId("admin-nav-dashboard")).toBeVisible();

    await exerciseCollapse(page, {
      sidebarId: "admin-navigation",
      mainId: "admin-main-content",
      storageKey: "sidebar:admin",
      toggleId: "admin-sidebar-collapse",
      navId: "admin-nav-dashboard",
      navLabel: "Tổng quan",
    });

    await test.step("in the rail a group parent navigates to its first child", async () => {
      await page.getByTestId("admin-sidebar-collapse").click();
      const group = page.getByTestId("admin-nav-group-jobs");
      await expect(group).toHaveAttribute("aria-label", "Quản lý việc làm");
      await group.click();
      await expect(page).toHaveURL(/\/admin\/jobs\/?$/);
    });
  });
});
