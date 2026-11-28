/**
 * Helpers for E2E specs that need a real account on the live backend.
 *
 *   import { registerUser, signInWithToken } from "./support/test-users.js";
 *   const user = await registerUser(request);                 // API call, unique email
 *   await signInWithToken(page, user, "/interview");          // browser is now logged in
 *
 * Accounts are created at runtime with unique `e2e-*@example.test` emails (no cleanup needed).
 */
export const API_URL = process.env.E2E_API_URL || "https://api.hireready.tuannm.app";
export const TEST_PASSWORD = "Passw0rd!23";

export const uniqueEmail = (prefix = "e2e") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

/**
 * Register a user through the real API.
 * @param request Playwright APIRequestContext (the `request` fixture)
 * @param {{ role?: "jobseeker" | "employer", name?: string }} options
 * @returns {{ email, password, name, role, token, user }}
 */
export async function registerUser(request, { role = "jobseeker", name = "E2E User" } = {}) {
  const email = uniqueEmail(role === "employer" ? "e2e-emp" : "e2e");
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: { name, email, password: TEST_PASSWORD, role },
  });
  if (!response.ok()) {
    throw new Error(`register failed ${response.status()}: ${await response.text()}`);
  }
  const { token, ...user } = (await response.json()).data;
  return { email, password: TEST_PASSWORD, name, role, token, user };
}

/**
 * Put the account's JWT into localStorage (as AuthContext does) and open `path`.
 * The app then verifies the token with GET /api/auth/me on load.
 */
export async function signInWithToken(page, { token }, path = "/") {
  await page.goto("/");
  await page.evaluate((jwt) => localStorage.setItem("token", jwt), token);
  await page.goto(path);
}
