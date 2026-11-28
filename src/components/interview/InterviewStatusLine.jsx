import useInterviewStatusText from "../../hooks/useInterviewStatusText";
import { cx } from "../ui";

const TONES = { error: "text-danger", warn: "text-warning" };

/** One polite live line for progress / warnings / errors. Keeps its height so the layout does not jump. */
const InterviewStatusLine = ({ status, center = false, className = "", testId }) => {
  const text = useInterviewStatusText(status);
  return (
    <p
      aria-live="polite"
      data-testid={testId}
      data-tone={status?.tone || "info"}
      className={cx(
        "min-h-5 text-sm leading-5",
        TONES[status?.tone] || "text-muted",
        center && "text-center",
        className
      )}
    >
      {text}
    </p>
  );
};

export default InterviewStatusLine;
