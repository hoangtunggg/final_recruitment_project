import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import FormField from "../../components/ui/FormField";
import { useFieldA11y } from "../../components/ui/form-field-helpers";
import { controlClass } from "../../components/ui/ui-styles";

/**
 * Password input with a show/hide toggle (the toggle is type="button" so it never submits the form).
 * Props: label, error, id, name, value, onChange, autoComplete, placeholder, required.
 */
const PasswordField = ({ label, error, id, toggleLabels, ...inputProps }) => {
  const { t } = useTranslation("auth");
  const [visible, setVisible] = useState(false);
  const { fieldId, errorId, describedBy } = useFieldA11y({ id, error });
  const labels = toggleLabels || { show: t("password.show"), hide: t("password.hide") };

  return (
    <FormField fieldId={fieldId} errorId={errorId} label={label} error={error} required>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted" aria-hidden="true">
          <FiLock />
        </span>
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(Boolean(error), "pl-10 pr-12")}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? labels.hide : labels.show}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-control text-muted hover:text-ink"
        >
          {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>
    </FormField>
  );
};

export default PasswordField;
