import { cn } from "@/lib/utils";

export type SkeletonType = "text" | "card" | "button" | "avatar" | "question-card";

export interface SkeletonLoaderProps {
  type?: SkeletonType;
  lines?: number;
  className?: string;
}

function SkeletonLoader({ type = "text", lines = 3, className }: SkeletonLoaderProps) {
  return (
    <div
      role="status"
      aria-label="Carregando..."
      className={cn("animate-pulse", className)}
    >
      {type === "text" && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
          <div className="h-4 w-3/5 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      )}

      {type === "card" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      )}

      {type === "button" && (
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      )}

      {type === "avatar" && (
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
      )}

      {type === "question-card" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="h-7 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-6" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      <span className="sr-only">Carregando...</span>
    </div>
  );
}

export { SkeletonLoader };
