import { SkeletonBox } from "@/components/admin/SkeletonBox";

// Rendered by Next.js during navigation to any /admin route while the
// server component of the destination page is fetching. Gives the app
// a "loading" state that feels native.
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <SkeletonBox className="h-40 rounded-2xl" />
      <SkeletonBox className="h-64 rounded-2xl" />
    </div>
  );
}
