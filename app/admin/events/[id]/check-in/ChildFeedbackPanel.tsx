"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Check, ClipboardList } from "lucide-react";
import {
  upsertChildFeedback,
  type FeedbackPayload,
  type Rating,
} from "./feedback-actions";

const CRITERIA: { key: keyof FeedbackPayload; label: string; help?: string }[] = [
  { key: "settling_in", label: "Settling in", help: "Arrived calm or needed warm-up time" },
  { key: "engagement", label: "Engagement", help: "Took part in activities offered" },
  { key: "confidence", label: "Confidence", help: "Willingness to try/explore" },
  { key: "social_connection", label: "Social connection", help: "Interacted with other children or adults" },
  { key: "communication", label: "Communication", help: "Verbal and non-verbal expression" },
  { key: "emotional_regulation", label: "Emotional regulation", help: "Managed transitions, frustration, waiting" },
  { key: "parent_child_connection", label: "Parent–child connection", help: "Observable warmth/attunement with their grown-up" },
];

const RATING_OPTIONS: { value: Rating; label: string; tint: string }[] = [
  { value: "needs_support", label: "Needs support", tint: "bg-amber-100 text-amber-900 border-amber-200" },
  { value: "doing_well", label: "Doing well", tint: "bg-sky-100 text-sky-900 border-sky-200" },
  { value: "thriving", label: "Thriving", tint: "bg-emerald-100 text-emerald-900 border-emerald-200" },
];

const EMPTY: FeedbackPayload = {
  settling_in: null,
  engagement: null,
  confidence: null,
  social_connection: null,
  communication: null,
  emotional_regulation: null,
  parent_child_connection: null,
  notable: null,
};

export function ChildFeedbackPanel({
  childId,
  eventId,
  childName,
  initial,
}: {
  childId: string;
  eventId: string;
  childName: string;
  initial: FeedbackPayload | null;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FeedbackPayload>(initial ?? EMPTY);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasAny =
    CRITERIA.some((c) => data[c.key]) ||
    (data.notable && data.notable.trim().length > 0);
  const existing = initial != null;

  function setRating(key: keyof FeedbackPayload, value: Rating) {
    setData((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await upsertChildFeedback({ childId, eventId, payload: data });
        setSavedAt(Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  const showSaved = savedAt && Date.now() - savedAt < 2500;

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <span className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span className="font-medium">
            Session feedback — {childName}
            {existing && (
              <span className="ml-2 text-xs text-emerald-700">· saved</span>
            )}
            {!existing && hasAny && (
              <span className="ml-2 text-xs text-amber-700">· unsaved</span>
            )}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            {CRITERIA.map((c) => {
              const current = data[c.key] as Rating | null;
              return (
                <div
                  key={c.key}
                  className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-4 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.label}</p>
                    {c.help && (
                      <p className="text-[11px] text-gray-500 leading-tight">
                        {c.help}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {RATING_OPTIONS.map((r) => {
                      const active = current === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRating(c.key, r.value)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition ${
                            active
                              ? r.tint + " font-bold"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Anything notable
            </label>
            <textarea
              value={data.notable ?? ""}
              onChange={(e) =>
                setData({ ...data, notable: e.target.value })
              }
              rows={2}
              placeholder="First time trying playdough, got frustrated but settled with parent support."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Internal to the team. Not shown to the parent.
            </p>
          </div>

          <div className="flex items-center justify-between">
            {error && <p className="text-xs text-red-600">{error}</p>}
            {!error && showSaved && (
              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </p>
            )}
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="ml-auto inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {existing ? "Update" : "Save feedback"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
