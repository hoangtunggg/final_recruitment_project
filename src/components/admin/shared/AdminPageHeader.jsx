/**
 * Admin page title block: compact version of the ui PageHeader (admin tools are denser than public pages).
 * Props: title, subtitle, actions (node, right side), leading (node before the title, e.g. a back button).
 */
const AdminPageHeader = ({ title, subtitle, actions, leading }) => (
  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="min-w-0">
      {leading}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{title}</h1>
      {subtitle && <p className="text-muted mt-1 text-sm sm:text-base">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </header>
);

export default AdminPageHeader;
