import { useEffect, useState } from "react";
import { useJobs } from "../../../context/JobContext";
import { jobService } from "../../../services/jobService";
import { companyService } from "../../../services/companyService";

/**
 * Loads one job (from the in-memory list first, then the API) and the matching company profile.
 * Returns { job, loading, failed, companyProfile }. `failed` is a boolean: the page shows its own
 * translated message instead of the raw HTTP error.
 */
const useJobDetail = (id) => {
  const { getPublishedJobs } = useJobs();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let isMounted = true;

    const loadJob = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const found = getPublishedJobs().find((item) => String(item.id) === String(id));
        if (found) {
          if (isMounted) setJob(found);
          return;
        }
        const response = await jobService.getJobById(id);
        if (isMounted) setJob(response.data || response);
      } catch (err) {
        console.error("Error loading job details:", err);
        if (isMounted) {
          setJob(null);
          setFailed(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadJob();
    return () => {
      isMounted = false;
    };
  }, [id, getPublishedJobs]);

  useEffect(() => {
    if (!job?.company) return undefined;
    let active = true;
    companyService
      .getAll({ limit: 100 })
      .then((response) => {
        if (!active) return;
        const match = (response.data || []).find(
          (company) =>
            company.id === job.companyId ||
            company.name.toLowerCase() === job.company.toLowerCase()
        );
        setCompanyProfile(match || null);
      })
      .catch(() => {
        if (active) setCompanyProfile(null);
      });
    return () => {
      active = false;
    };
  }, [job?.company, job?.companyId]);

  return { job, loading, failed, companyProfile };
};

export default useJobDetail;
