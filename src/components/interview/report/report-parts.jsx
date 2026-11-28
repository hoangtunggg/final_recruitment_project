import { cx } from "../../ui";

/** Bordered panel holding report blocks. */
export const ReportPanel = ({ children, testId }) => (
  <div data-testid={testId} className="mt-10 rounded-[10px] border border-tint-line bg-surface px-5 py-6 sm:px-[30px]">
    {children}
  </div>
);

/** Small teal pill (verdict, priority, score ...). soft = tinted, otherwise solid. */
export const ReportChip = ({ children, soft = false }) => (
  <span
    className={cx(
      "inline-block rounded-full px-3 leading-[22px]",
      soft ? "bg-primary-500/15 text-[13px] text-primary-text" : "bg-primary-600 text-sm text-white"
    )}
  >
    {children}
  </span>
);

/** Bulleted list with comfortable spacing; `render` returns the item content. */
export const ReportList = ({ items, render }) => (
  <ul className="m-0 list-disc space-y-1.5 pl-5 font-normal">
    {items.map((item, index) => (
      <li key={index}>{render(item)}</li>
    ))}
  </ul>
);
