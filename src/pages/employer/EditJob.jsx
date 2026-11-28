import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { jobService } from "../../services/jobService";
import JobEditorForm from "../../components/employer/JobEditorForm";
import { Button, Card, PageHeader } from "../../components/ui";
import { serverErrorText } from "./employer-api-helpers";

const EditJob = () => {
  const { t } = useTranslation(["employer", "common"]);
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { raw } from the server or { key } for a built-in message

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobService.getJobById(id);
      if (response && response.success && response.data) {
        setJob(response.data);
      } else {
        throw new Error(response?.error || "job_not_found");
      }
    } catch (err) {
      console.error("Error fetching job for edit:", err);
      const notFound = err.message === "job_not_found";
      const raw = notFound ? null : serverErrorText(err);
      setError(raw ? { raw } : { key: notFound ? "editJob.notFound" : "editJob.loadFailed" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("employer:editJob.eyebrow")}
        title={
          loading
            ? t("employer:editJob.loadingTitle")
            : t("employer:editJob.title", { title: job?.title || t("employer:editJob.fallbackTitle") })
        }
        subtitle={t("employer:editJob.subtitle")}
        actions={
          <Button as={Link} to="/employer/jobs" variant="outline" size="sm" leftIcon={<FiArrowLeft />}>
            {t("employer:editJob.backToJobs")}
          </Button>
        }
      />

      {loading && (
        <div className="mx-auto max-w-4xl" role="status" aria-label={t("common:states.loading")}>
          <Card className="animate-pulse space-y-4 p-8">
            <div className="h-6 w-48 rounded bg-line" />
            <div className="h-10 w-full rounded-control bg-line" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded-control bg-line" />
              <div className="h-10 rounded-control bg-line" />
            </div>
            <div className="h-32 rounded-control bg-line" />
          </Card>
        </div>
      )}

      {error && !loading && (
        <Card className="mx-auto max-w-4xl space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-danger/10 text-danger">
            <FiAlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-extrabold text-ink">{t("employer:editJob.errorTitle")}</h2>
          <p className="mx-auto max-w-md text-sm text-muted">
            {error.raw || t(`employer:${error.key}`)}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <Button onClick={fetchJob} size="sm" leftIcon={<FiRefreshCw />}>
              {t("common:states.retry")}
            </Button>
            <Button as={Link} to="/employer/jobs" variant="outline" size="sm">
              {t("employer:editJob.backToManage")}
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && job && <JobEditorForm initialData={job} isEdit={true} jobId={id} />}
    </div>
  );
};

export default EditJob;
