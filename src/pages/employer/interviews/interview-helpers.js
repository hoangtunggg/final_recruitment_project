/** Display name of the candidate on an application record (several backend shapes), or null. */
export const candidateNameOf = (app) => app.user?.name || app.applicantName || app.name || null;
