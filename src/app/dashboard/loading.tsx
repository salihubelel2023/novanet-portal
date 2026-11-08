export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-surface-2" />
        <div className="h-4 w-72 rounded bg-surface-2/60" />
      </div>

      {/* Stats / Cards Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border/50 bg-surface/50 p-4" />
        ))}
      </div>

      {/* Main Content Card Skeleton */}
      <div className="h-96 rounded-2xl border border-border/50 bg-surface/50 p-6" />
    </div>
  );
}
