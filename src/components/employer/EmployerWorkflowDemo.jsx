import React, { useState } from "react";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiArrowRight,
  FiEye,
  FiMessageSquare,
  FiClock,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import { useEnumLabel } from "../../i18n/helpers";

// Step keys map to employer:workflowDemo.steps.<key>.{title,desc,line1,line2}
const WORKFLOW_STEPS = [
  { key: "apply", icon: FiUser, tone: "primary" },
  { key: "review", icon: FiEye, tone: "primary" },
  { key: "notes", icon: FiMail, tone: "success" },
  { key: "underReview", icon: FiClock, tone: "warning" },
  { key: "interview", icon: FiCalendar, tone: "primary" },
  { key: "notify", icon: FiMessageSquare, tone: "primary" },
  { key: "decision", icon: FiCheckCircle, tone: "success" },
];

const TONES = {
  primary: { panel: "border-tint-line bg-tint", icon: "text-primary-text", stepper: "bg-primary-600" },
  success: { panel: "border-success/30 bg-success/10", icon: "text-success", stepper: "bg-success" },
  warning: { panel: "border-warning/30 bg-warning/10", icon: "text-warning", stepper: "bg-warning" },
};

/** Seven-step visual guide to the candidate pipeline, shown in the dashboard "Workflow demo" modal. */
const EmployerWorkflowDemo = () => {
  const { t } = useTranslation(["employer", "common"]);
  const label = useEnumLabel();
  const [currentStep, setCurrentStep] = useState(1);
  const total = WORKFLOW_STEPS.length;
  const active = WORKFLOW_STEPS[currentStep - 1];
  const tone = TONES[active.tone];
  const ActiveIcon = active.icon;
  const stepText = (field) => t(`employer:workflowDemo.steps.${active.key}.${field}`);

  return (
    <div className="mx-auto max-w-3xl py-2">
      {/* Progress stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {WORKFLOW_STEPS.map((step, index) => {
            const number = index + 1;
            const StepIcon = step.icon;
            return (
              <div key={step.key} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(number)}
                  aria-current={number === currentStep ? "step" : undefined}
                  title={t(`employer:workflowDemo.steps.${step.key}.title`)}
                  aria-label={t(`employer:workflowDemo.steps.${step.key}.title`)}
                  className={`flex h-9 w-9 items-center justify-center rounded-control text-xs font-bold transition-all ${
                    number === currentStep
                      ? `${TONES[step.tone].stepper} text-white shadow-focus`
                      : number < currentStep
                      ? "bg-tint text-primary-text"
                      : "bg-tint text-muted"
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </button>
                {index < total - 1 && (
                  <div
                    className={`mx-1 h-0.5 w-6 transition-colors sm:w-10 ${
                      number < currentStep ? "bg-primary-500" : "bg-line"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between px-1 text-[11px] text-muted">
          <span>{t("employer:workflowDemo.phaseApply")}</span>
          <span>{t("employer:workflowDemo.phaseReview")}</span>
          <span>{t("employer:workflowDemo.phaseInterview")}</span>
          <span>{t("employer:workflowDemo.phaseOffer")}</span>
        </div>
      </div>

      {/* Current step */}
      <div className="mb-6 text-center" aria-live="polite">
        <div className={`mb-4 rounded-card border p-6 ${tone.panel}`}>
          <ActiveIcon className={`mx-auto mb-3 h-14 w-14 ${tone.icon}`} aria-hidden="true" />
          <h3 className="mb-1 text-lg font-extrabold text-ink">{stepText("title")}</h3>
          <p className="mb-4 text-sm text-muted">{stepText("desc")}</p>
          {active.key === "underReview" ? (
            <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
              <span className="text-xs font-medium text-muted">{label("applicationStatus", "pending")}</span>
              <FiArrowRight className="text-muted" aria-hidden="true" />
              <span className="text-xs font-bold text-warning">{label("applicationStatus", "under_review")}</span>
            </div>
          ) : (
            <div className="space-y-1 rounded-card border border-line bg-surface p-4 text-left text-xs">
              <p className="font-semibold text-ink">{stepText("line1")}</p>
              <p className="text-muted">{stepText("line2")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-line pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          {t("common:actions.previous")}
        </Button>
        <span className="text-xs font-medium text-muted">
          {t("employer:workflowDemo.stepOf", { current: currentStep, total })}
        </span>
        <Button
          size="sm"
          onClick={() => setCurrentStep((s) => Math.min(total, s + 1))}
          disabled={currentStep === total}
        >
          {currentStep === total ? t("employer:workflowDemo.done") : t("employer:workflowDemo.nextStep")}
        </Button>
      </div>
    </div>
  );
};

export default EmployerWorkflowDemo;
