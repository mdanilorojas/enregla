interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
}

// Compound components for common skeleton patterns
Skeleton.Card = function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton className="mb-2" width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
        <Skeleton width={80} height={24} className="rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton height={8} />
        <Skeleton height={8} width="80%" />
        <Skeleton height={8} width="90%" />
      </div>
    </div>
  );
};

Skeleton.Table = function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-4">
          <Skeleton width="20%" height={12} />
          <Skeleton width="15%" height={12} />
          <Skeleton width="25%" height={12} />
          <Skeleton width="20%" height={12} />
          <Skeleton width="20%" height={12} />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4 items-center">
            <Skeleton width="20%" height={14} />
            <Skeleton width="15%" height={14} />
            <Skeleton width="25%" height={14} />
            <Skeleton width="20%" height={14} />
            <Skeleton width="20%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
};

Skeleton.Grid = function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton.Card key={i} />
      ))}
    </div>
  );
};
