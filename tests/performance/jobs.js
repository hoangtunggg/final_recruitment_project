import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/* global __ENV, __VU */

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:3001";
const profile = __ENV.PROFILE || "smoke";

const profiles = {
  smoke: {
    vus: 1,
    duration: "15s",
  },
  baseline: {
    stages: [
      { duration: "10s", target: 5 },
      { duration: "30s", target: 5 },
      { duration: "10s", target: 0 },
    ],
  },
  load: {
    stages: [
      { duration: "1m", target: 20 },
      { duration: "3m", target: 20 },
      { duration: "1m", target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: "1m", target: 20 },
      { duration: "1m", target: 50 },
      { duration: "1m", target: 100 },
      { duration: "1m", target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: "20s", target: 5 },
      { duration: "10s", target: 100 },
      { duration: "30s", target: 100 },
      { duration: "20s", target: 0 },
    ],
  },
  soak: {
    stages: [
      { duration: "2m", target: 20 },
      { duration: "30m", target: 20 },
      { duration: "2m", target: 0 },
    ],
  },
};

if (!profiles[profile]) {
  throw new Error(`Unknown PROFILE '${profile}'`);
}

export const options = {
  ...profiles[profile],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    checks: ["rate>0.99"],
  },
};

const applicationErrors = new Rate("application_errors");
const jobListLatency = new Trend("job_list_latency", true);

export default function () {
  const page = (__VU % 10) + 1;
  const response = http.get(`${baseUrl}/api/jobs?page=${page}&limit=10`, {
    tags: { endpoint: "public_jobs" },
    timeout: "5s",
  });

  jobListLatency.add(response.timings.duration);
  const ok = check(response, {
    "jobs returns 200": (r) => r.status === 200,
    "jobs contract is intact": (r) => {
      try {
        const body = r.json();
        return body.success === true && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });
  applicationErrors.add(!ok);
  sleep(0.2);
}
