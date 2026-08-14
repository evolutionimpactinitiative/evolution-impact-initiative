import { SkeletonBox } from "@/components/admin/SkeletonBox";

// B2S dashboard-shaped skeleton — same layout as the real page so the
// jump feels seamless when the data arrives.
export default function B2SDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-4 w-72" />
      </div>

      {/* Capacity strip */}
      <SkeletonBox className="h-24 rounded-2xl" />

      {/* Registration mode + waitlist panel */}
      <SkeletonBox className="h-48 rounded-2xl" />

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Stat cards row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Donations panel */}
      <SkeletonBox className="h-72 rounded-2xl" />

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
