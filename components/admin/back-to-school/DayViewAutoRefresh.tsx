"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Pause, Play } from "lucide-react";

interface Props {
  intervalMs?: number;
}

export function DayViewAutoRefresh({ intervalMs = 20_000 }: Props) {
  const router = useRouter();
  const [paused, setPaused] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs, paused]);

  // Bump every second so the "updated 12s ago" label ticks.
  React.useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
  // Silence unused-tick warning; state read implicitly via seconds calc.
  void tick;

  return (
    <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
      <span className="inline-flex items-center gap-1">
        <RefreshCw
          className={`h-3 w-3 ${paused ? "" : "animate-spin-slow"}`}
        />
        Auto-refresh
        {paused
          ? " paused"
          : ` · updated ${seconds}s ago`}
      </span>
      <button
        type="button"
        onClick={() => {
          setPaused((v) => !v);
          if (paused) {
            router.refresh();
            setLastRefresh(new Date());
          }
        }}
        className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        {paused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={() => {
          router.refresh();
          setLastRefresh(new Date());
        }}
        className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        <RefreshCw className="h-3 w-3" />
        Refresh now
      </button>
    </div>
  );
}
