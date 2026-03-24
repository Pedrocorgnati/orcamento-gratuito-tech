interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 8, cols = 6 }: TableSkeletonProps) {
  const colWidths = [120, 160, 60, 120, 140, 100]

  return (
    <div
      role="status"
      aria-label="Carregando leads..."
      className="overflow-hidden rounded-lg border border-gray-200 bg-white animate-pulse"
    >
      {/* Header skeleton */}
      <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-gray-200"
            style={{ width: `${colWidths[i] ?? 100}px` }}
          />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-gray-100 px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-4 rounded bg-gray-100"
              style={{ width: `${colWidths[colIdx] ?? 100}px` }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Carregando leads...</span>
    </div>
  )
}
