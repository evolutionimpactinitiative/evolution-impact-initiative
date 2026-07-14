"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Loader2,
  Phone,
  MapPin,
  Package,
  ClipboardCheck,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

type Child = {
  id: string;
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  sex: string | null;
  school: string | null;
  needs: string[] | null;
  items_given: Record<string, boolean> | null;
  notes: string | null;
  display_order: number;
};

export type CollectionSheetRegistration = {
  id: string;
  parent_name: string;
  parent_phone: string;
  parent_postcode: string | null;
  status: string;
  distribution_status: "collected" | "partial" | "no_show" | null;
  distribution_recorded_at: string | null;
  registration_children: Child[];
};

interface Props {
  registration: CollectionSheetRegistration;
  stewardTokenIdForRecording: string | null;
  stewardTokenParam: string | null;
}

const NEED_LABEL: Record<string, string> = {
  uniform: "Uniform",
  stationery: "Stationery",
  bag: "Bag",
};

export function CollectionSheet({
  registration,
  stewardTokenIdForRecording,
  stewardTokenParam,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<
    "collected" | "partial" | "no_show" | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  const initialItems: Record<string, Record<string, boolean>> = React.useMemo(
    () => {
      const map: Record<string, Record<string, boolean>> = {};
      for (const c of registration.registration_children) {
        const seed: Record<string, boolean> = {};
        for (const n of c.needs ?? []) seed[n] = false;
        map[c.id] = { ...seed, ...(c.items_given ?? {}) };
      }
      return map;
    },
    [registration],
  );
  const [itemsGiven, setItemsGiven] =
    React.useState<Record<string, Record<string, boolean>>>(initialItems);

  function toggleItem(childId: string, need: string) {
    if (!stewardTokenIdForRecording) return;
    setItemsGiven((prev) => ({
      ...prev,
      [childId]: {
        ...(prev[childId] || {}),
        [need]: !(prev[childId]?.[need] ?? false),
      },
    }));
  }

  async function recordStatus(
    distributionStatus: "collected" | "partial" | "no_show",
  ) {
    if (!stewardTokenParam) {
      setError("Not authenticated as a steward.");
      return;
    }
    setError(null);
    setBusy(distributionStatus);
    try {
      const res = await fetch(
        `/api/back-to-school/distribution/${registration.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stewardToken: stewardTokenParam,
            distributionStatus,
            itemsGiven,
          }),
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

  const children = [...registration.registration_children].sort(
    (a, b) => a.display_order - b.display_order,
  );

  const readOnly = !stewardTokenIdForRecording;
  const alreadyRecorded = !!registration.distribution_status;

  return (
    <div className="space-y-4">
      {/* Family header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-blue font-heading font-bold mb-1">
              Family
            </p>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-dark">
              {registration.parent_name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {children.length} {children.length === 1 ? "child" : "children"} ·{" "}
              {registration.parent_postcode || "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${registration.parent_phone}`}
              className="inline-flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </div>
        </div>

        {alreadyRecorded && (
          <div
            className={
              registration.distribution_status === "collected"
                ? "mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-sm flex items-center gap-2"
                : registration.distribution_status === "partial"
                  ? "mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-sm flex items-center gap-2"
                  : "mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-900 text-sm flex items-center gap-2"
            }
          >
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            <span>
              Marked as{" "}
              <strong className="font-heading font-bold uppercase">
                {registration.distribution_status}
              </strong>
              {registration.distribution_recorded_at
                ? ` on ${new Date(
                    registration.distribution_recorded_at,
                  ).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : ""}
              .
            </span>
          </div>
        )}

        {!readOnly && !alreadyRecorded && (
          <p className="text-xs text-gray-500 mt-3">
            Tick items as you hand them over, then choose an outcome.
          </p>
        )}

        {readOnly && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Read-only view. If you&rsquo;re at the door, please show your
            personal scanner link.
          </div>
        )}
      </div>

      {/* Per-child sheets */}
      <div className="space-y-3">
        {children.map((c, i) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-gray-200 p-5"
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-heading font-bold">
                Child {i + 1}
              </p>
              <p className="font-heading font-bold text-brand-dark text-lg">
                {c.child_name}
              </p>
              {c.child_age != null && (
                <span className="text-xs text-gray-500">· age {c.child_age}</span>
              )}
              {c.sex && (
                <span className="text-xs text-gray-500 capitalize">
                  · {c.sex.replace(/_/g, " ")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-brand-pale/40 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-blue font-heading font-bold mb-1">
                  Uniform size
                </p>
                <p className="font-heading font-black text-2xl text-brand-dark">
                  {c.uniform_size ?? "-"}
                </p>
              </div>
              <div className="bg-brand-pale/40 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-blue font-heading font-bold mb-1">
                  School
                </p>
                <p className="text-sm text-brand-dark font-semibold">
                  {c.school || "-"}
                </p>
              </div>
            </div>

            {c.notes && (
              <div className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 italic">
                &ldquo;{c.notes}&rdquo;
              </div>
            )}

            <p className="text-xs uppercase tracking-widest text-gray-500 font-heading font-bold mb-2">
              Items given
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(c.needs ?? []).map((n) => {
                const isOn = itemsGiven[c.id]?.[n] === true;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleItem(c.id, n)}
                    disabled={readOnly || alreadyRecorded}
                    className={[
                      "text-left p-3 rounded-lg border-2 transition-all",
                      isOn
                        ? "bg-brand-green text-white border-brand-green"
                        : "bg-white border-brand-blue/15 hover:border-brand-blue",
                      readOnly || alreadyRecorded
                        ? "cursor-default opacity-90"
                        : "cursor-pointer",
                    ].join(" ")}
                    aria-pressed={isOn}
                  >
                    <div className="flex items-center gap-2">
                      {isOn ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4 text-brand-blue" />
                      )}
                      <span className="font-heading font-bold text-sm">
                        {NEED_LABEL[n] || n}
                      </span>
                    </div>
                  </button>
                );
              })}
              {(!c.needs || c.needs.length === 0) && (
                <p className="text-xs text-gray-500 col-span-full">
                  No items requested.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Outcome buttons */}
      {!readOnly && !alreadyRecorded && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-heading font-bold mb-3">
            Record outcome
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => recordStatus("collected")}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-2 bg-brand-green text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {busy === "collected" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Collected
            </button>
            <button
              type="button"
              onClick={() => recordStatus("partial")}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {busy === "partial" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              Partial
            </button>
            <button
              type="button"
              onClick={() => recordStatus("no_show")}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-2 bg-white text-red-700 border border-red-200 px-4 py-3 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {busy === "no_show" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              No-show
            </button>
          </div>
        </div>
      )}

      {/* Back to scanner */}
      {stewardTokenParam && (
        <div className="text-center pt-2">
          <a
            href={`/b2s/scan/${encodeURIComponent(stewardTokenParam)}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-dark"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to scanner
            {stewardTokenIdForRecording ? "" : " (auth required)"}
          </a>
        </div>
      )}

      {/* Address callout for direct-URL visitors */}
      {readOnly && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-sm text-gray-700 space-y-1">
          <p className="inline-flex items-center gap-1.5 font-heading font-bold text-brand-dark">
            <MapPin className="h-4 w-4 text-brand-blue" />
            Sunlight Centre
          </p>
          <p className="text-xs text-gray-500 ml-6">
            Richmond Road, Gillingham, ME7 1LX
          </p>
        </div>
      )}
    </div>
  );
}
