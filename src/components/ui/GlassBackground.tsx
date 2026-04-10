/**
 * GlassBackground - Decorative animated glass blobs for premium feel
 * Place behind main content for subtle ambient effect
 */

export function GlassBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blob 1 - Blue top-right */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)',
        }}
      />

      {/* Blob 2 - Orange bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob animation-delay-2000"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0) 70%)',
        }}
      />

      {/* Blob 3 - Emerald center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl animate-blob animation-delay-4000"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%)',
        }}
      />

      {/* Glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/30" />
    </div>
  );
}
