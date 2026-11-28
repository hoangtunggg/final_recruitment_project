import { Card, cx } from "../ui";

/**
 * One permission card (Figma "Permission"): icon, title + description, and an on/off switch.
 * The switch is a real <button role="switch">, so keyboard and screen readers get on/off state.
 * `checked` shows the current state; `onToggle` runs on activation (enable the mic / re-check the service).
 */
const InterviewSwitchRow = ({ icon, title, description, checked, onToggle, switchLabel, testId }) => (
  <Card tone="grey" padding="none" className="flex items-center gap-5 p-5" data-testid={testId}>
    <span
      aria-hidden="true"
      className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[10px] bg-line text-2xl text-ink"
    >
      {icon}
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="font-semibold">{title}</span>
      <span className="text-sm font-normal text-muted" data-testid={`${testId}-text`}>
        {description}
      </span>
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={switchLabel}
      data-testid={`${testId}-switch`}
      onClick={onToggle}
      // 44px tap area around the 36x20 Figma switch
      className="group grid h-11 w-14 shrink-0 cursor-pointer place-items-center rounded-pill"
    >
      <span
        className={cx(
          "relative block h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary-600" : "bg-line-strong"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  </Card>
);

export default InterviewSwitchRow;
