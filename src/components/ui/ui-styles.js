/** Tiny class-name joiner: cx("a", cond && "b") -> "a b". */
export const cx = (...parts) => parts.filter(Boolean).join(" ");

/**
 * Shared look of text-like form controls (Input / Textarea / Select).
 * Figma "InputText": 6px radius, 1px line, teal border + soft ring on focus.
 */
export const controlClass = (hasError, extra = "") =>
  cx(
    "block w-full min-h-11 rounded-control border bg-surface px-3 py-2 text-base text-ink",
    "placeholder:text-muted/75 transition-colors",
    "focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:bg-tint disabled:opacity-60",
    hasError
      ? "border-danger focus:border-danger"
      : "border-line focus:border-primary-500",
    extra
  );
