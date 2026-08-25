"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertOctagon, Loader2, Timer } from "lucide-react";

interface Props {
  eventId: string;
}

// Buttons that run the post-drive tidy-up jobs:
//   • Release-reservations — flips any still-reserved pick lines to
//     'released' after the drive ends, freeing stock back into supply
//   • Auto-blacklist — finds anyone who no-showed BOTH drives and adds
//     them to back_to_school_blacklist (email + phone match)
//
// Both are idempotent and safe to click multiple times.
export function CollectionActions({ eventId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function run(action: "release" | "blacklist") {
    if (
      !confirm(
        action === "release"
          ? "Release all still-reserved items for this drive? Use this AFTER the drive is over so unclaimed stock returns to the pool."
          : "Add every parent who no-showed BOTH drives to the blacklist? This will block them from future programs.",
      )
    ) {
      return;
    }
    setBusy(action);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch(
        `/api/back-to-school/collection/actions/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMsg(data?.message ?? "Done.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run("release")}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
        >
          {busy === "release" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Timer className="h-3.5 w-3.5" />
          )}
          Release unclaimed reservations
        </button>
        <button
          type="button"
          onClick={() => run("blacklist")}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
        >
          {busy === "blacklist" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <AlertOctagon className="h-3.5 w-3.5" />
          )}
          Auto-blacklist double no-shows
        </button>
      </div>
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
      {err && <p className="text-xs text-red-700">{err}</p>}
    </div>
  );
}
