"use client";

import * as React from "react";

interface Options {
  onRefresh: () => void | Promise<void>;
  // Pixels the user has to pull down before it triggers refresh.
  threshold?: number;
  // Distance in pixels that the indicator moves (capped so it doesn't
  // travel the whole screen if the user really yanks it).
  maxPull?: number;
  // Disable on non-touch pointers so a laptop trackpad doesn't fire.
  touchOnly?: boolean;
}

interface PullState {
  // Current pull distance in px (0 = not pulling, > 0 = pulled down).
  pull: number;
  // True once the user has crossed the threshold and released.
  refreshing: boolean;
}

// Adds "pull down at the top of the page to refresh" gesture, like a
// native mobile app. Only fires when the window is scrolled to the very
// top so users can normally rubber-band without accidentally refreshing.
export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 120,
  touchOnly = true,
}: Options): PullState {
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startYRef = React.useRef<number | null>(null);
  const activeRef = React.useRef(false);
  const onRefreshRef = React.useRef(onRefresh);

  React.useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  React.useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    function scrolledToTop() {
      return (
        window.scrollY <= 0 && document.documentElement.scrollTop <= 0
      );
    }

    function onTouchStart(e: TouchEvent) {
      // Guard: TouchEvent only fires for touch, so `touchOnly` is trivially
      // satisfied when we're inside this listener. The prop is here for
      // future symmetry with a pointer-event version.
      void touchOnly;
      if (!scrolledToTop()) return;
      startYRef.current = e.touches[0].clientY;
      activeRef.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!activeRef.current || startYRef.current == null) return;
      // If the page has since scrolled, abort — user is doing a normal
      // scroll gesture, not a pull.
      if (!scrolledToTop()) {
        activeRef.current = false;
        setPull(0);
        return;
      }
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Non-linear resistance — feels more natural than a 1:1 drag.
      const resistant = Math.min(maxPull, Math.pow(dy, 0.85));
      setPull(resistant);
    }

    function onTouchEnd() {
      if (!activeRef.current) return;
      activeRef.current = false;
      const current = pull;
      if (current >= threshold) {
        setRefreshing(true);
        // Snap the indicator to threshold while refresh runs so the user
        // sees "I'm reloading" rather than the raw pulled distance.
        setPull(threshold);
        Promise.resolve(onRefreshRef.current()).finally(() => {
          setRefreshing(false);
          setPull(0);
        });
      } else {
        setPull(0);
      }
      startYRef.current = null;
    }

    // Passive false so we can conceptually cancel the browser's rubber-band —
    // but we don't call preventDefault, so it stays true here. Keeping the
    // listener passive is best for scroll performance.
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [threshold, maxPull, touchOnly, pull]);

  return { pull, refreshing };
}
