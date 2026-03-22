import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-6">
        <SkeletonLoader type="text" lines={2} className="mx-auto max-w-md" />
        <SkeletonLoader type="card" />
        <SkeletonLoader type="button" className="mx-auto" />
      </div>
    </div>
  );
}
