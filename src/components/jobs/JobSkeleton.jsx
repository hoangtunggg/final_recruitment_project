/** Loading placeholder with the same footprint as JobCard (no layout jump when data arrives). */
const JobSkeleton = () => (
  <div
    aria-hidden="true"
    className="min-h-64 animate-pulse rounded-card border border-tint-line bg-surface p-5 shadow-card"
  >
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-card bg-tint" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-tint" />
        <div className="h-3 w-1/3 rounded bg-tint" />
      </div>
    </div>
    <div className="mt-5 h-5 w-4/5 rounded bg-tint" />
    <div className="mt-2 h-5 w-1/2 rounded bg-tint" />
    <div className="mt-5 flex gap-2">
      <div className="h-6 w-20 rounded-pill bg-tint" />
      <div className="h-6 w-16 rounded-pill bg-tint" />
    </div>
    <div className="mt-6 flex justify-between border-t border-line pt-4">
      <div className="h-4 w-24 rounded bg-tint" />
      <div className="h-4 w-16 rounded bg-tint" />
    </div>
  </div>
);

export default JobSkeleton;
