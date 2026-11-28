import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";

/**
 * Desktop-only (lg+) button that collapses the sidebar to an icon rail or expands it again.
 * The caller passes the already translated `label` ("Collapse sidebar" / "Expand sidebar").
 * Props: collapsed, onToggle, controls (id of the <aside>), label, testId.
 */
const SidebarCollapseButton = ({ collapsed, onToggle, controls, label, testId }) => {
  const Icon = collapsed ? FiChevronsRight : FiChevronsLeft;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-controls={controls}
      aria-expanded={!collapsed}
      aria-label={label}
      title={label}
      data-testid={testId}
      className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-tint hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 lg:inline-flex"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

export default SidebarCollapseButton;
