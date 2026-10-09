export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function ListSkeleton({ rows = 8 }) {
  return (
    <div className="rounded-2xl md:rounded-xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard overflow-hidden" aria-busy="true">
      <div className="p-4 border-b border-slate-100 dark:border-darkborder"><Skeleton className="h-10 w-full max-w-sm" /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-100 dark:border-darkborder/60 last:border-0" style={{ opacity: 1 - i * 0.08 }}>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
