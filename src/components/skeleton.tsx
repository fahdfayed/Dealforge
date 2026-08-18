export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full last:w-3/4" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 p-4 space-y-3 ${className}`}>
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
