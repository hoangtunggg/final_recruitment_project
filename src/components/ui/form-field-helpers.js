import { useId } from "react";

/**
 * Accessibility ids for a labelled form control: stable id, hint/error ids and the
 * `aria-describedby` value (only ids that are actually rendered).
 */
export const useFieldA11y = ({ id, hint, error }) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint && !error ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { fieldId, hintId, errorId, describedBy };
};
