import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-border)] to-[var(--color-surface)] bg-[length:200%_100%]",
        "animate-shimmer",
        {
          'rounded-full': variant === 'circular',
          'rounded-md': variant === 'rectangular' || variant === 'default',
          'h-4 rounded': variant === 'text',
        },
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}
      {...props}
    />
  )
}

interface SkeletonCardProps {
  lines?: number
}

function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  )
}

interface SkeletonListProps {
  count?: number
}

function SkeletonList({ count = 4 }: SkeletonListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonList }
