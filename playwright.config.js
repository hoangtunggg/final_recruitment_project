import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against the REAL backend (never mock API responses).
 * `npm run e2e` starts the Vite dev server itself (or reuses one already on :5173).
 * Override the backend with E2E_API_URL, e.g. E2E_API_URL=http://localhost:3001 npm run e2e
 */
const API_URL = process.env.E2E_API_URL || "https://api.hireready.tuannm.app";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      VITE_API_URL: API_URL,
      VITE_CVJD_MATCHING_ENABLED: "false",
    },
  },
});
