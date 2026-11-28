import { useTranslation } from "react-i18next";
import useInterviewLabel from "../../../hooks/useInterviewLabel";
import { safeHttpUrl } from "../interview-format";
import { ReportChip, ReportList } from "./report-parts";

/** Study plan: topic, priority, concrete actions and reading links (http/https only; other schemes are plain text). */
const ReportStudyPlan = ({ items }) => {
  const { t } = useTranslation("interview");
  const label = useInterviewLabel();
  return (
    <ReportList
      items={items}
      render={(item) => (
        <>
          <b>{item.topic}</b> <ReportChip soft>{label("report.priority", item.priority)}</ReportChip>
          {item.actions?.length > 0 && (
            <ReportList items={item.actions} render={(action) => action} />
          )}
          {item.resources?.length > 0 && (
            <p className="mt-1 text-sm text-muted">
              {t("report.resources")}{" "}
              {item.resources.map((resource, index) => {
                const href = safeHttpUrl(resource.url);
                return (
                  <span key={`${resource.title}-${index}`}>
                    {index > 0 && " • "}
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-text underline underline-offset-2"
                      >
                        {resource.title}
                      </a>
                    ) : (
                      resource.title
                    )}
                  </span>
                );
              })}
            </p>
          )}
        </>
      )}
    />
  );
};

export default ReportStudyPlan;
