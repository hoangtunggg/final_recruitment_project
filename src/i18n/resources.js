/**
 * Static bundle of every dictionary (no async loading, so first paint is already translated).
 * One JSON per namespace and language; each FE area edits only its own namespace:
 *   common (shared chrome, buttons, states, enums) | public | auth | candidate | interview | employer | admin |
 *   adminOps (admin dashboard, reports, notifications, settings, employer management)
 * To add a namespace: create vi/<ns>.json + en/<ns>.json, then add it below and to NAMESPACES.
 */
import viCommon from "./locales/vi/common.json";
import viPublic from "./locales/vi/public.json";
import viAuth from "./locales/vi/auth.json";
import viCandidate from "./locales/vi/candidate.json";
import viInterview from "./locales/vi/interview.json";
import viEmployer from "./locales/vi/employer.json";
import viAdmin from "./locales/vi/admin.json";
import viAdminOps from "./locales/vi/adminOps.json";

import enCommon from "./locales/en/common.json";
import enPublic from "./locales/en/public.json";
import enAuth from "./locales/en/auth.json";
import enCandidate from "./locales/en/candidate.json";
import enInterview from "./locales/en/interview.json";
import enEmployer from "./locales/en/employer.json";
import enAdmin from "./locales/en/admin.json";
import enAdminOps from "./locales/en/adminOps.json";

export const NAMESPACES = [
  "common",
  "public",
  "auth",
  "candidate",
  "interview",
  "employer",
  "admin",
  "adminOps",
];

const resources = {
  vi: {
    common: viCommon,
    public: viPublic,
    auth: viAuth,
    candidate: viCandidate,
    interview: viInterview,
    employer: viEmployer,
    admin: viAdmin,
    adminOps: viAdminOps,
  },
  en: {
    common: enCommon,
    public: enPublic,
    auth: enAuth,
    candidate: enCandidate,
    interview: enInterview,
    employer: enEmployer,
    admin: enAdmin,
    adminOps: enAdminOps,
  },
};

export default resources;
