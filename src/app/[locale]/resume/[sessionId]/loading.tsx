import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

export default function ResumeLoading() {
  return (
    <div
      data-testid="page-resume-loading"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-xl space-y-6">
        <SkeletonLoader type="text" lines={2} className="mx-auto max-w-md" />
        <SkeletonLoader type="card" />
        <div className="mx-auto max-w-xs">
          <SkeletonLoader type="button" />
        </div>
      </div>
    </div>
  )
}
