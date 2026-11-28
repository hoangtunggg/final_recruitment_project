import { FiChevronDown } from "react-icons/fi";
import FormField from "./FormField";
import { useFieldA11y } from "./form-field-helpers";
import { controlClass, cx } from "./ui-styles";

/** Native select with custom chevron. Same props as Input; pass <option> children. */
const Select = ({
  label,
  hint,
  error,
  required = false,
  id,
  className = "",
  inputClassName = "",
  children,
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
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(Boolean(error), cx("appearance-none pr-10", inputClassName))}
          {...rest}
        >
          {children}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    </FormField>
  );
};

export default Select;
