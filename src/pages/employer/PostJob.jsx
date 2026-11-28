import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import JobEditorForm from "../../components/employer/JobEditorForm";
import { Button, PageHeader } from "../../components/ui";

const PostJob = () => {
  const { t } = useTranslation("employer");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("postJob.eyebrow")}
        title={t("postJob.title")}
        subtitle={t("postJob.subtitle")}
        actions={
          <Button as={Link} to="/employer/jobs" variant="outline" size="sm" leftIcon={<FiArrowLeft />}>
            {t("postJob.viewAll")}
          </Button>
        }
      />
      <JobEditorForm isEdit={false} />
    </div>
  );
};

export default PostJob;
