import { useId } from "react";
import { FiFileText, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { cx } from "../ui";

/**
 * CV file chooser (PDF / DOCX). The native input is visually hidden but stays focusable and keyboard-operable;
 * the box around it shows the focus ring. The file is parsed by ai-service when the form is submitted.
 */
const InterviewCvPicker = ({ file, onChange }) => {
  const { t } = useTranslation("interview");
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {t("setup.cv")}
      </label>
      <div
        className={cx(
          "flex min-h-11 items-center gap-3 rounded-control border border-line bg-surface px-3 py-1.5",
          "focus-within:border-primary-500 focus-within:shadow-focus"
        )}
      >
        <input
          id={inputId}
          data-testid="interview-cv-input"
          type="file"
          accept=".pdf,.docx"
          aria-describedby={hintId}
          className="peer sr-only"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <label
          htmlFor={inputId}
          className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-pill border border-primary-600 px-4 text-sm font-semibold text-primary-text hover:bg-tint peer-focus-visible:bg-tint"
        >
          <FiFileText aria-hidden="true" />
          {t("setup.cvChoose")}
        </label>
        <span className={cx("min-w-0 flex-1 truncate text-sm", file ? "text-ink" : "text-muted")}>
          {file ? file.name : t("setup.cvNone")}
        </span>
        {file && (
          <button
            type="button"
            aria-label={t("setup.cvRemove")}
            title={t("setup.cvRemove")}
            onClick={() => onChange(null)}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-tint hover:text-ink"
          >
            <FiX aria-hidden="true" />
          </button>
        )}
      </div>
      <p id={hintId} className="text-sm text-muted">
        {t("setup.cvHint")}
      </p>
    </div>
  );
};

export default InterviewCvPicker;
