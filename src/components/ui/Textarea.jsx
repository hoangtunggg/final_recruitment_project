import FormField from "./FormField";
import { useFieldA11y } from "./form-field-helpers";
import { controlClass } from "./ui-styles";

/** Multi-line input. Same props as Input (minus leftIcon) plus native textarea props (rows ...). */
const Textarea = ({
  label,
  hint,
  error,
  required = false,
  id,
  className = "",
  inputClassName = "",
  rows = 4,
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
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClass(Boolean(error), inputClassName)}
        {...rest}
      />
    </FormField>
  );
};

export default Textarea;
