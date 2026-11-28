// Pipeline statuses accepted by the backend (values are sent as-is; labels come from common:enums.applicationStatus).
export const APPLICATION_STATUSES = [
  "pending",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
];
