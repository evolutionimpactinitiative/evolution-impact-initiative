"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, EyeOff, Trash2, StickyNote } from "lucide-react";
import {
  addNoteAction,
  flipNoteVisibilityAction,
  deleteNoteAction,
} from "./notes-actions";

export type NoteRow = {
  id: string;
  target_type: "family" | "child";
  target_id: string;
  body: string;
  visibility: "internal" | "external";
  author_name: string | null;
  created_at: string;
};

type Target =
  | { type: "family"; id: string; label: string }
  | { type: "child"; id: string; label: string };

export function NotesSection({
  familyId,
  target,
  notes,
}: {
  familyId: string;
  target: Target;
  notes: NoteRow[];
}) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"internal" | "external">(
    "internal",
  );
  const [adding, startAdd] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const text = body.trim();
    if (!text) return;
    if (visibility === "external") {
      if (
        !confirm(
          "This note will be visible to the family — they'll get an email and dashboard notification. Continue?",
        )
      ) {
        return;
      }
    }
    setError(null);
    startAdd(async () => {
      try {
        await addNoteAction({
          familyId,
          targetType: target.type,
          targetId: target.id,
          body: text,
          visibility,
        });
        setBody("");
        setVisibility("internal");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add note");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-4 w-4 text-gray-500" />
        <h3 className="font-heading font-bold text-base text-brand-dark">
          Notes · {target.label}
        </h3>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No notes yet.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {notes.map((n) => (
            <NoteRowItem key={n.id} note={n} familyId={familyId} />
          ))}
        </ul>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            target.type === "family"
              ? "Add a note about this family…"
              : `Add a note about ${target.label}…`
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-xs">
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "internal" | "external")
              }
              className="border border-gray-300 rounded-md text-xs px-2 py-1"
            >
              <option value="internal">Internal (team only)</option>
              <option value="external">External (visible to family)</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={adding || !body.trim()}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {adding && <Loader2 className="h-3 w-3 animate-spin" />}
              Add note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteRowItem({
  note,
  familyId,
}: {
  note: NoteRow;
  familyId: string;
}) {
  const [pending, startAction] = useTransition();
  const isExternal = note.visibility === "external";

  function flip() {
    const next = isExternal ? "internal" : "external";
    if (next === "external") {
      if (
        !confirm(
          "Make this note visible to the family? They'll get an email and dashboard notification.",
        )
      ) {
        return;
      }
    }
    startAction(async () => {
      await flipNoteVisibilityAction({
        familyId,
        noteId: note.id,
        nextVisibility: next,
      });
    });
  }

  function remove() {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    startAction(async () => {
      await deleteNoteAction({ familyId, noteId: note.id });
    });
  }

  return (
    <li
      className={`rounded-lg border p-3 ${
        isExternal
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-gray-200 bg-gray-50/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {note.body}
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            {note.author_name || "Unknown"} ·{" "}
            {new Date(note.created_at).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
              isExternal
                ? "bg-emerald-200 text-emerald-900"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {isExternal ? "External" : "Internal"}
          </span>
          <button
            type="button"
            onClick={flip}
            disabled={pending}
            title={
              isExternal
                ? "Hide from family (internal)"
                : "Share with family (external)"
            }
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
          >
            {isExternal ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            title="Delete note"
            className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}
