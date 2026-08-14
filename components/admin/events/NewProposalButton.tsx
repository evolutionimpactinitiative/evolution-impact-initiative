"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function NewProposalButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/event-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      // Straight into the wizard
      router.push(`/admin/events/proposals/${data.id}/edit?step=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
      >
        <Plus className="h-4 w-4" />
        New proposal
      </button>
      <BottomSheet
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="New event proposal"
      >
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-gray-600">
            Start with a working title — you can change it any time. We&rsquo;ll
            open the 10-step wizard next.
          </p>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Working title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Summer Fun Day 2026"
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create &amp; open wizard
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
