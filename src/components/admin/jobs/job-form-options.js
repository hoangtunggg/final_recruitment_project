// API values for the admin job forms and filters. Labels come from common:enums.* (never change the values).
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
export const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead", "Manager"];
export const JOB_STATUSES = ["Published", "active", "Draft", "Closed", "filled", "inactive"];
export const APPROVAL_STATUSES = ["approved", "pending", "rejected"];

export const EMPTY_JOB_FORM = {
  title: "",
  company: "",
  location: "",
  type: "Full-time",
  experience: "Entry Level",
  salary: "",
  status: "Published",
  approvalStatus: "approved",
  description: "",
  requirements: "",
  responsibilities: "",
  benefits: "",
  applicationDeadline: "",
  contactEmail: "",
  contactPhone: "",
};
