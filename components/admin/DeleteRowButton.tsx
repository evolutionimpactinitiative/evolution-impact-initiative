"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface Props {
  // The DELETE endpoint to hit.
  href: string;
  // Human label — "event", "proposal", etc. Shown in the modal copy.
  entityLabel: string;
  // What the user sees confirming which specific row is going away.
  itemName: string;
  // Extra red text below the item name (e.g. "This will also remove 5 registrations").
  warning?: string;
  // Optional: what to do after a successful delete. Defaults to router.refresh().
  onDeleted?: () => void;
  // Compact icon-only button vs the default label+icon.
  iconOnly?: boolean;
}

export function DeleteRowButton({
  href,
  entityLabel,
  itemName,
  warning,
  onDeleted,
  iconOnly = true,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(href, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setOpen(false);
      if (onDeleted) onDeleted();
      else router.refresh();
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Delete ${entityLabel}`}
        title={`Delete ${entityLabel}`}
        className={
          iconOnly
            ? "inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            : "inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 text-sm font-heading font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
        }
      >
        <Trash2 className={iconOnly ? "h-4 w-4" : "h-4 w-4"} />
        {!iconOnly && "Delete"}
      </button>

      <BottomSheet
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={`Delete ${entityLabel}?`}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            You&rsquo;re about to permanently delete:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <p className="font-heading font-bold text-brand-dark">{itemName}</p>
          </div>
          {warning && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {warning}
            </p>
          )}
          <p className="text-xs text-gray-500">This can&rsquo;t be undone.</p>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete forever
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
