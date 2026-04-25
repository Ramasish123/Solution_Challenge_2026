export function SkeletonCard({ className = "" }) {
  return <div className={`glass-panel animate-pulse p-5 ${className}`}><div className="h-3 w-24 rounded-full bg-slate-200 mb-4" /><div className="h-8 w-16 rounded-full bg-slate-100" /></div>;
}

export function SkeletonTable({ rows = 4, className = "" }) {
  return (
    <div className={`glass-panel p-6 animate-pulse ${className}`}>
      <div className="h-3 w-32 rounded-full bg-slate-200 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 flex-1 rounded-full bg-slate-100" />
            <div className="h-4 w-20 rounded-full bg-slate-100" />
            <div className="h-4 w-16 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ cells = 6, className = "" }) {
  return (
    <div className={`glass-panel p-6 animate-pulse ${className}`}>
      <div className="h-3 w-28 rounded-full bg-slate-200 mb-6" />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cells }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 h-20" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className = "" }) {
  return (
    <div className={`glass-panel p-6 animate-pulse ${className}`}>
      <div className="h-3 w-32 rounded-full bg-slate-200 mb-4" />
      <div className="h-5 w-48 rounded-full bg-slate-100 mb-6" />
      <div className="h-64 rounded-xl bg-slate-50" />
    </div>
  );
}
