/**
 * Helpers to create / remove a job through the real employer API (no mocks).
 *
 *   const employer = await registerUser(request, { role: "employer" });
 *   const job = await createJob(request, employer);       // visible publicly (status "active")
 *   ...
 *   await deleteJob(request, employer, job.id);           // clean up the shared staging DB
 */
import { API_URL } from "./test-users.js";

const authHeaders = ({ token }) => ({ Authorization: `Bearer ${token}` });

/** POST /api/jobs as an employer. Returns the created job (with its id). */
export async function createJob(request, employer, overrides = {}) {
  const stamp = Date.now();
  const response = await request.post(`${API_URL}/api/jobs`, {
    headers: authHeaders(employer),
    data: {
      title: `E2E Backend Engineer ${stamp}`,
      company: "E2E Test Company",
      location: "Ho Chi Minh City",
      type: "Full-time",
      experience: "Mid Level",
      salary: "$60k - $90k",
      skills: "Node.js, PostgreSQL, Docker",
      description: "Build and maintain REST APIs for the recruitment platform.",
      requirements: "3 years of Node.js experience\nSolid SQL knowledge",
      responsibilities: "Design APIs\nReview pull requests",
      benefits: "Flexible hours\n13th month salary",
      ...overrides,
    },
  });
  if (!response.ok()) {
    throw new Error(`createJob failed ${response.status()}: ${await response.text()}`);
  }
  return (await response.json()).data;
}

/** DELETE /api/jobs/:id as the owning employer (best effort, never throws). */
export async function deleteJob(request, employer, id) {
  try {
    await request.delete(`${API_URL}/api/jobs/${id}`, { headers: authHeaders(employer) });
  } catch {
    // Cleanup must not fail the test run.
  }
}
