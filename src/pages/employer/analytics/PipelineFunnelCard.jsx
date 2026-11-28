import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui";

/** Horizontal bars of application counts per pipeline stage (percent of the loaded sample). */
const PipelineFunnelCard = ({ stages, sampleCount, totalApplications, isTruncated }) => {
  const { t } = useTranslation("employer");

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink">{t("analytics.funnel.title")}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {isTruncated
              ? t("analytics.funnel.subtitleTruncated", { loaded: sampleCount, total: totalApplications })
              : t("analytics.funnel.subtitle")}
          </p>
        </div>
        <Link
          to="/employer/applicants"
          className="flex shrink-0 items-center space-x-1 text-xs font-bold text-primary-text hover:underline"
        >
          <span>{t("analytics.funnel.track")}</span>
          <FiArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {totalApplications === 0 ? (
        <p className="py-4 text-center text-xs text-muted">{t("analytics.funnel.empty")}</p>
      ) : (
        <ul className="space-y-3 pt-2">
          {stages.map((stage) => {
            const pct = sampleCount > 0 ? Math.round((stage.count / sampleCount) * 100) : 0;
            return (
              <li key={stage.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{t(`analytics.pipeline.${stage.key}`)}</span>
                  <span className={`font-bold ${stage.textColor}`}>
                    {stage.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-tint">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default PipelineFunnelCard;
