"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function CreateAlbumButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "published">(
    "published",
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/admin/gallery/albums/${data.album.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
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
        New album
      </button>
      <BottomSheet
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Create album"
      >
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Album name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Back to School 2026"
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Description (optional)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              placeholder="Short blurb shown on the public album page"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
              Status
            </span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
              className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="published">Published (visible to public)</option>
              <option value="draft">Draft (admin only)</option>
            </select>
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create album
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
