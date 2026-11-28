import React from "react";
import { Card } from "../ui";

/** Overview section: title + subtitle + "view all" action, then a body (rows / skeleton / empty state). */
const DashboardPanel = ({ title, subtitle, actionLabel, onAction, children }) => (
  <Card as="section" padding="none" className="overflow-hidden">
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {onAction && (
        <button type="button" onClick={onAction} className="min-h-11 shrink-0 cursor-pointer text-sm font-semibold text-primary-text hover:underline">
          {actionLabel}
        </button>
      )}
    </div>
    {children}
  </Card>
);

/** Placeholder rows while a panel loads. */
export const PanelSkeleton = () => (
  <div className="space-y-4 p-6" aria-hidden="true">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex animate-pulse items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-tint" />
          <div className="h-3 w-1/4 rounded bg-tint" />
        </div>
        <div className="h-6 w-24 rounded-pill bg-tint" />
      </div>
    ))}
  </div>
);

/** Compact empty state used inside panels. */
export const PanelEmpty = ({ icon, title, description, action }) => (
  <div className="px-6 py-10 text-center">
    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tint text-xl text-primary-text" aria-hidden="true">
      {icon}
    </span>
    <p className="font-bold text-ink">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default DashboardPanel;
