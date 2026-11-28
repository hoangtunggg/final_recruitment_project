import FormField from "./FormField";
import { useFieldA11y } from "./form-field-helpers";
import { controlClass, cx } from "./ui-styles";

/**
 * Text input with label, hint, error and optional left icon.
 * Props: label, hint, error (string), required, leftIcon (node), id, className (wrapper),
 *        inputClassName, ...native input props (type, value, onChange, placeholder, ref ...).
 */
const Input = ({
  label,
  hint,
  error,
  required = false,
  leftIcon,
  id,
  className = "",
  inputClassName = "",
  ...rest
}) => {
  const { fieldId, hintId, errorId, describedBy } = useFieldA11y({ id, hint, error });
  return (
    <FormField
      fieldId={fieldId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(Boolean(error), cx(leftIcon && "pl-10", inputClassName))}
          {...rest}
        />
      </div>
    </FormField>
  );
};

export default Input;
