"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Loader2, ImageIcon, Ban } from "lucide-react";
import type { GalleryComment, CommentStatus } from "@/lib/gallery/types";

interface Props {
  comment: GalleryComment;
  imageUrl: string | null;
  imageTitle: string | null;
  albumSlug: string | null;
  albumName: string | null;
}

export function GalleryCommentModerationRow({
  comment,
  imageUrl,
  imageTitle,
  albumSlug,
  albumName,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<CommentStatus | "delete" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function setStatus(status: CommentStatus) {
    setBusy(status);
    setError(null);
    try {
      const res = await fetch(
        `/api/gallery/comments/${comment.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    const ok = confirm("Delete this comment permanently?");
    if (!ok) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/gallery/comments/${comment.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(null);
    }
  }

  const publicHref =
    albumSlug ? `/gallery/${albumSlug}/${comment.image_id}` : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3">
      {/* Image thumb */}
      <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg overflow-hidden bg-brand-pale/40 relative">
        {imageUrl ? (
          publicHref ? (
            <Link href={publicHref} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={imageTitle ?? ""}
                className="w-full h-full object-cover"
              />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={imageTitle ?? ""}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
          <p className="font-heading font-bold text-brand-dark text-sm">
            {comment.author_name}
          </p>
          <StatusPill status={comment.status} />
          {comment.parent_comment_id && (
            <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-400">
              · reply
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">
          {albumName ? `${albumName} · ` : ""}
          {imageTitle ?? "Untitled image"} ·{" "}
          {new Date(comment.created_at).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {comment.author_email && ` · ${comment.author_email}`}
        </p>
        <p className="text-sm text-brand-dark whitespace-pre-wrap leading-relaxed mb-3">
          {comment.body}
        </p>

        {error && <p className="text-xs text-red-700 mb-2">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {comment.status !== "approved" && (
            <button
              type="button"
              onClick={() => setStatus("approved")}
              disabled={!!busy}
              className="inline-flex items-center gap-1 bg-brand-green text-white px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {busy === "approved" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve
            </button>
          )}
          {comment.status !== "rejected" && comment.status !== "spam" && (
            <button
              type="button"
              onClick={() => setStatus("rejected")}
              disabled={!!busy}
              className="inline-flex items-center gap-1 bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {busy === "rejected" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Reject
            </button>
          )}
          {comment.status !== "spam" && (
            <button
              type="button"
              onClick={() => setStatus("spam")}
              disabled={!!busy}
              className="inline-flex items-center gap-1 bg-white text-amber-800 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {busy === "spam" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              Spam
            </button>
          )}
          <button
            type="button"
            onClick={del}
            disabled={!!busy}
            className="inline-flex items-center gap-1 bg-white text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest ml-auto disabled:opacity-50"
          >
            {busy === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: CommentStatus }) {
  const map: Record<CommentStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
    approved: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Approved",
    },
    rejected: { bg: "bg-gray-100", text: "text-gray-700", label: "Rejected" },
    spam: { bg: "bg-red-100", text: "text-red-700", label: "Spam" },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}
