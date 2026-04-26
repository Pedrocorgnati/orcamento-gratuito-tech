import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function LocaleLoading() {
  return (
    <div data-testid="page-locale-loading" className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-6">
        <SkeletonLoader type="text" lines={2} className="mx-auto max-w-md" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      </div>
    </div>
  );
}
