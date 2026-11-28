import { cx } from "../../ui";

/** Titled section inside a report panel; renders nothing when there is no content (children === null/false). */
const ReportBlock = ({ title, children, className = "" }) => {
  if (!children) return null;
  return (
    <section className={cx("mt-6 first:mt-0", className)}>
      <h3 className="mb-2 text-xl leading-7">{title}</h3>
      {children}
    </section>
  );
};

export default ReportBlock;
