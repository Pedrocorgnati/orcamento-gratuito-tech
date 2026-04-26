import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

export default function FlowQuestionLoading() {
  return (
    <div
      data-testid="page-flow-loading"
      className="flex min-h-[60vh] flex-col items-center px-4 py-10"
    >
      <div className="w-full max-w-2xl space-y-6">
        <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <SkeletonLoader type="question-card" />
      </div>
    </div>
  )
}
