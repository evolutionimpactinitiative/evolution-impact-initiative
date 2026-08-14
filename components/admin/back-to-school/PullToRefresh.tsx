"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

// Attaches a native-app-style pull-to-refresh gesture to the current
// page. Renders an absolutely-positioned indicator that follows the
// user's finger as they pull down from the top.
export function PullToRefresh() {
  const router = useRouter();
  const { pull, refreshing } = usePullToRefresh({
    onRefresh: () => {
      router.refresh();
      // Give the server render + client rehydration a beat so the
      // indicator doesn't vanish before the fresh numbers appear.
      return new Promise((resolve) => setTimeout(resolve, 600));
    },
  });

  const opacity = Math.min(1, pull / 40);
  const rotate = Math.min(360, pull * 4);

  if (pull === 0 && !refreshing) return null;

  return (
    <div
      className="fixed left-0 right-0 z-30 flex justify-center pointer-events-none"
      style={{
        top: `calc(env(safe-area-inset-top) + 3.5rem)`,
        transform: `translateY(${Math.max(0, pull - 30)}px)`,
        opacity,
        transition: refreshing ? "transform 0.15s ease-out" : "none",
      }}
    >
      <div className="bg-white shadow-md border border-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
        <RefreshCw
          className={
            "h-5 w-5 text-brand-blue " + (refreshing ? "animate-spin" : "")
          }
          style={{
            transform: refreshing ? undefined : `rotate(${rotate}deg)`,
          }}
        />
      </div>
    </div>
  );
}
