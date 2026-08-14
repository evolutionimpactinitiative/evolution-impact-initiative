import { cn } from "@/lib/utils";

// Consistent skeleton primitive. Uses a subtle pulse animation.
export function SkeletonBox({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gray-200/70",
        className,
      )}
    />
  );
}
