"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Reply, Check } from "lucide-react";
import type { GalleryCommentNode } from "@/lib/gallery/types";

interface Props {
  imageId: string;
  tree: GalleryCommentNode[];
}

const LS_KEY = "gallery.commenter";

interface StoredCommenter {
  name: string;
  email: string;
}

// Public comments UI — threaded list on top, root form at bottom, per-comment
// reply forms open inline. Persists commenter's name + email in localStorage
// so return visitors don't retype.
export function GalleryComments({ imageId, tree }: Props) {
  const [remembered, setRemembered] = React.useState<StoredCommenter>({
    name: "",
    email: "",
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setRemembered(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function remember(next: StoredCommenter) {
    setRemembered(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const totalCount = React.useMemo(() => countAll(tree), [tree]);

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-black text-xl text-brand-dark">
        Comments{" "}
        <span className="text-gray-400 text-sm font-normal">
          ({totalCount})
        </span>
      </h2>

      {tree.length === 0 ? (
        <div className="bg-brand-pale/40 rounded-xl p-6 text-center text-gray-600 text-sm">
          <MessageSquare className="h-6 w-6 mx-auto text-brand-blue mb-2" />
          Be the first to leave a comment.
        </div>
      ) : (
        <ol className="space-y-4">
          {tree.map((node) => (
            <li key={node.id}>
              <CommentBlock
                node={node}
                imageId={imageId}
                remembered={remembered}
                onSubmitted={remember}
              />
            </li>
          ))}
        </ol>
      )}

      {/* Root form */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">Leave a comment</p>
        <CommentForm
          imageId={imageId}
          parentId={null}
          remembered={remembered}
          onSubmitted={remember}
        />
      </div>
    </div>
  );
}

function CommentBlock({
  node,
  imageId,
  remembered,
  onSubmitted,
  depth = 0,
}: {
  node: GalleryCommentNode;
  imageId: string;
  remembered: StoredCommenter;
  onSubmitted: (c: StoredCommenter) => void;
  depth?: number;
}) {
  const [replyOpen, setReplyOpen] = React.useState(false);
  // Cap visual indent so deep threads don't march off the right edge.
  const indentClass = depth === 0 ? "" : depth === 1 ? "ml-4 md:ml-8" : "ml-8 md:ml-12";

  return (
    <div className={indentClass}>
      <article className="bg-white border border-gray-200 rounded-xl p-4">
        <header className="flex items-baseline gap-2 mb-2">
          <p className="font-heading font-bold text-brand-dark">
            {node.author_name}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(node.created_at).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </header>
        <p className="text-sm text-brand-dark whitespace-pre-wrap leading-relaxed">
          {node.body}
        </p>
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs text-brand-blue font-heading font-bold uppercase tracking-widest hover:text-brand-dark"
        >
          <Reply className="h-3.5 w-3.5" />
          {replyOpen ? "Cancel reply" : "Reply"}
        </button>
        {replyOpen && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <CommentForm
              imageId={imageId}
              parentId={node.id}
              remembered={remembered}
              onSubmitted={(c) => {
                onSubmitted(c);
                setReplyOpen(false);
              }}
              compact
            />
          </div>
        )}
      </article>
      {node.replies.length > 0 && (
        <ol className="mt-3 space-y-3">
          {node.replies.map((r) => (
            <li key={r.id}>
              <CommentBlock
                node={r}
                imageId={imageId}
                remembered={remembered}
                onSubmitted={onSubmitted}
                depth={Math.min(depth + 1, 2)}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CommentForm({
  imageId,
  parentId,
  remembered,
  onSubmitted,
  compact = false,
}: {
  imageId: string;
  parentId: string | null;
  remembered: StoredCommenter;
  onSubmitted: (c: StoredCommenter) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(remembered.name);
  const [email, setEmail] = React.useState(remembered.email);
  const [body, setBody] = React.useState("");
  const [website, setWebsite] = React.useState(""); // honeypot
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  // Keep local state in sync when localStorage-backed values load in
  React.useEffect(() => {
    if (remembered.name && !name) setName(remembered.name);
    if (remembered.email && !email) setEmail(remembered.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remembered.name, remembered.email]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          parentCommentId: parentId,
          authorName: name,
          authorEmail: email,
          body,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      onSubmitted({ name, email });
      setBody("");
      setSubmitted(true);
      // Even though the comment is pending, refresh so counts stay right.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900 flex items-start gap-2">
        <Check className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Thanks — your comment is with the team for review and will appear
          shortly.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Honeypot — kept in the DOM but invisible to real users. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Your name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
            Email <span className="text-gray-400 font-normal normal-case">(optional, private)</span>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            autoComplete="email"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
          Your comment
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={compact ? 3 : 4}
          required
          maxLength={1000}
          className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          placeholder="Share your thoughts…"
        />
        <span className="text-[10px] text-gray-400 mt-1 block">
          {body.length} / 1000
        </span>
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !name.trim() || !body.trim()}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {parentId ? "Post reply" : "Post comment"}
        </button>
        <p className="text-[11px] text-gray-500">
          Comments are moderated before they appear.
        </p>
      </div>
    </form>
  );
}

function countAll(nodes: GalleryCommentNode[]): number {
  let n = 0;
  for (const c of nodes) {
    n += 1 + countAll(c.replies);
  }
  return n;
}
