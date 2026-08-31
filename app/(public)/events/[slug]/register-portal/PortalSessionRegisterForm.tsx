"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Event, Child, ParentCarer } from "@/lib/supabase/types";

interface Props {
  event: Event;
  carer: ParentCarer;
  children: Child[];
}

function ageAtDate(dob: string, date: Date): number {
  const b = new Date(dob);
  let years = date.getFullYear() - b.getFullYear();
  if (
    date.getMonth() < b.getMonth() ||
    (date.getMonth() === b.getMonth() && date.getDate() < b.getDate())
  ) {
    years -= 1;
  }
  return years;
}

export function PortalSessionRegisterForm({ event, carer, children }: Props) {
  const router = useRouter();
  const sessionDate = useMemo(() => new Date(event.date), [event.date]);

  const eligibleChildren = children.map((c) => {
    const age = ageAtDate(c.date_of_birth, sessionDate);
    return {
      ...c,
      ageAtSession: age,
      eligible: age >= 0 && age <= 5,
    };
  });

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(eligibleChildren.filter((c) => c.eligible).map((c) => c.id)),
  );
  const [accessibilityNote, setAccessibilityNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selected.size === 0) {
      setError("Please choose at least one child.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/portal/register-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        childIds: Array.from(selected),
        accessibilityNote: accessibilityNote.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    router.push(`/portal/registrations/${data.registrationId}`);
  };

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-dark/10 p-6 md:p-8 text-center">
        <h2 className="font-heading font-black text-xl text-brand-dark mb-2">
          Add a child first
        </h2>
        <p className="text-brand-dark/70 mb-6">
          You need at least one child in your family to register for a Growing Together session.
        </p>
        <Button
          asChild
          className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
        >
          <Link href="/portal/family">
            <Plus className="mr-2 h-4 w-4" />
            Add a child
          </Link>
        </Button>
      </div>
    );
  }

  const noneEligible = eligibleChildren.every((c) => !c.eligible);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-brand-dark/10 p-6 md:p-8 space-y-6"
    >
      <div>
        <h2 className="font-heading font-black text-xl text-brand-dark mb-1">
          Who&rsquo;s coming?
        </h2>
        <p className="text-sm text-brand-dark/70 mb-4">
          Registering as <strong>{carer.name}</strong>. Growing Together is for children aged 0–5.
        </p>

        <div className="space-y-2">
          {eligibleChildren.map((child) => (
            <label
              key={child.id}
              className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${
                !child.eligible
                  ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                  : selected.has(child.id)
                    ? "border-brand-blue bg-brand-pale/30"
                    : "border-gray-200 hover:border-brand-blue/50"
              }`}
            >
              <input
                type="checkbox"
                disabled={!child.eligible}
                checked={selected.has(child.id)}
                onChange={() => toggle(child.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-heading font-bold text-brand-dark">{child.first_name}</p>
                <p className="text-xs text-brand-dark/60">
                  {child.eligible
                    ? `Would be ${child.ageAtSession} on the session date`
                    : child.ageAtSession > 5
                      ? `Too old for Growing Together (${child.ageAtSession} on the session date)`
                      : "Not born yet on session date"}
                </p>
              </div>
              {selected.has(child.id) && (
                <CheckCircle2 className="h-5 w-5 text-brand-blue" />
              )}
            </label>
          ))}
        </div>

        {noneEligible && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            None of your children are aged 0–5 on this session date. You can still browse other
            programmes — <Link href="/events" className="underline">see all events</Link>.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          Anything we should know for this session? (optional)
        </label>
        <textarea
          value={accessibilityNote}
          onChange={(e) => setAccessibilityNote(e.target.value)}
          rows={2}
          placeholder="Accessibility needs, first-time nerves, anything else that would help us welcome your family."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading || noneEligible || selected.size === 0}
        className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering…
          </>
        ) : (
          `Register ${selected.size || 0} ${selected.size === 1 ? "child" : "children"}`
        )}
      </Button>
    </form>
  );
}
