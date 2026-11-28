import { cx } from "./ui-styles";

const COLOURS = ["bg-brand-red", "bg-brand-orange", "bg-brand-parrot", "bg-brand-green", "bg-brand-teal"];

/**
 * The Figma 5-colour strip (red, orange, parrot, green, teal), 10px tall by default.
 * Props: className (e.g. "h-1.5" to make it thinner). Decorative, hidden from assistive tech.
 */
const TopBar = ({ className = "" }) => (
  <div aria-hidden="true" className={cx("flex h-2.5 w-full", className)}>
    {COLOURS.map((colour) => (
      <span key={colour} className={cx("flex-1", colour)} />
    ))}
  </div>
);

export default TopBar;
