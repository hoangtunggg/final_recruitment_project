import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui";

const TONES = {
  primary: { icon: "bg-tint border-tint-line text-primary-text", chip: "bg-tint text-primary-text" },
  success: { icon: "bg-success/10 border-success/30 text-success", chip: "bg-success/10 text-success" },
  warning: { icon: "bg-warning/10 border-warning/30 text-warning", chip: "bg-warning/10 text-warning" },
  neutral: { icon: "bg-tint border-line text-muted", chip: "bg-tint text-muted" },
};

/**
 * Headline metric card shared by the employer dashboard and analytics pages.
 * Props: icon (react-icons component), tone, chip {text, tone?}, chipPulse, label, value, footnote,
 *        to (optional route; renders the whole card as a link).
 */
const EmployerStatCard = ({ to, icon, tone = "primary", chip, chipPulse = false, label, value, footnote }) => {
  const Icon = icon;
  const card = (
    <Card interactive={Boolean(to)} className="h-full" padding="md">
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-card border ${TONES[tone].icon}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <span
          className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${TONES[chip.tone || tone].chip} ${
            chipPulse ? "animate-pulse" : ""
          }`}
        >
          {chip.text}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1 text-3xl font-extrabold text-ink">{value}</p>
        <p className="mt-1 text-xs text-muted">{footnote}</p>
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block rounded-card">
      {card}
    </Link>
  ) : (
    card
  );
};

export default EmployerStatCard;
