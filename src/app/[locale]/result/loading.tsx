import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

export default function ResultLoading() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 md:py-16">
      <div className="max-w-2xl mx-auto">
        <SkeletonLoader type="card" lines={8} />
      </div>
    </main>
  )
}
