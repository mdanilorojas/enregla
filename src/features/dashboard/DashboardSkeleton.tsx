export function DashboardSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Welcome header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-64 bg-gray-300 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
        <div className="h-12 w-48 bg-gray-200 rounded-xl" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Two column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>

      {/* Location grid skeleton */}
      <div>
        <div className="h-6 w-48 bg-gray-200 rounded mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
