"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Coins, Loader2 } from "lucide-react";

interface Props {
  memberId: string;
  memberName: string;
  isTreasurer: boolean;
}

export function TreasurerToggle({ memberId, memberName, isTreasurer }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = React.useState(isTreasurer);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_treasurer: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Update failed");
      router.refresh();
    } catch (err) {
      setOptimistic(!next); // revert
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={`Toggle treasurer for ${memberName}`}
        aria-pressed={optimistic}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-heading font-bold uppercase tracking-widest transition-colors disabled:opacity-60 ${
          optimistic
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
        title={
          optimistic
            ? "Click to remove treasurer role"
            : "Click to make this person a treasurer"
        }
      >
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Coins className="h-3 w-3" />
        )}
        {optimistic ? "Treasurer" : "Not treasurer"}
      </button>
      {error && <p className="text-[10px] text-red-700">{error}</p>}
    </div>
  );
}
