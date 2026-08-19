"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  // Passing an id lets the caller wire aria-labelledby to a heading in
  // children if they render their own title element.
  labelledBy?: string;
  // Optional max-height override — defaults to 85svh. Use "100svh" for
  // full-screen sheets on very tall content.
  maxHeight?: string;
}

// Mobile-first slide-up sheet. Renders as a centred dialog on md+ so it
// still feels natural on desktop. Uses <dialog> for a11y (focus trap +
// Esc-to-close for free).
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  labelledBy,
  maxHeight = "85svh",
}: BottomSheetProps) {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  // Two-phase mount so we can transition in. On open: mount + tick,
  // then flip visible=true to trigger transform transition.
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  // Escape key
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  // Portal to <body> so ancestor transforms / contain / filter don't
  // shrink our position:fixed viewport — otherwise a sheet rendered
  // inside a table cell or popover ends up clipped to the parent.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-[100]"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Sheet — bottom on mobile, centered dialog on desktop */}
      <div
        className={cn(
          "absolute left-0 right-0 bottom-0",
          "md:left-1/2 md:right-auto md:bottom-auto md:top-[10svh] md:-translate-x-1/2 md:w-full md:max-w-lg",
        )}
      >
        <div
          className={cn(
            "bg-white rounded-t-2xl md:rounded-2xl shadow-2xl transform transition-transform duration-200 ease-out",
            visible
              ? "translate-y-0 md:opacity-100"
              : "translate-y-full md:translate-y-4 md:opacity-0",
            "md:transition-[opacity,transform]",
          )}
          style={{
            maxHeight,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — visual only, not interactive */}
          <div className="md:hidden flex justify-center pt-2 pb-1">
            <span className="block h-1 w-10 rounded-full bg-gray-300" />
          </div>

          {title && (
            <div className="px-5 pt-3 md:pt-5 pb-2">
              <h2
                id={labelledBy}
                className="font-heading font-black text-brand-dark text-lg"
              >
                {title}
              </h2>
            </div>
          )}

          <div
            className="overflow-y-auto px-5 pb-5 pt-2"
            style={{ maxHeight: `calc(${maxHeight} - 4rem)` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
