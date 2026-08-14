"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import {
  AGE_GROUP_OPTIONS,
  EVENT_TYPE_OPTIONS,
  PROMOTION_CHANNELS,
  REGISTRATION_METHODS,
  SAFEGUARDING_PRACTICES,
  type ActivityRow,
  type CostLine,
  type EventProposal,
  type EventType,
  type RiskRow,
  type ScheduleRow,
  type StaffRow,
  type VenueType,
} from "@/lib/event-proposals/types";

const TOTAL_STEPS = 10;

const STEP_TITLES = [
  "The gist",
  "When",
  "Where",
  "Who's it for",
  "Purpose",
  "The plan",
  "Team",
  "Kit & budget",
  "Risk",
  "Promotion & tracking",
];

interface Props {
  initial: EventProposal;
  team: Array<{ id: string; name: string | null; email: string; role: string | null }>;
  funds: Array<{ id: string; code: string; name: string }>;
  initialStep: number;
}

export function ProposalWizard({ initial, team, funds, initialStep }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [proposal, setProposal] = React.useState<EventProposal>(initial);
  const [step, setStep] = React.useState<number>(initialStep);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);

  // Keep URL in sync when step changes so back-button + refresh work
  React.useEffect(() => {
    const next = new URLSearchParams(params.toString());
    next.set("step", String(step));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // scroll to top on step change for good measure
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function update<K extends keyof EventProposal>(k: K, v: EventProposal[K]) {
    setProposal((p) => ({ ...p, [k]: v }));
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setSaveError(null);
    try {
      const patch = extractPatchForStep(proposal, step);
      if (Object.keys(patch).length === 0) {
        setSavedAt(new Date());
        return true;
      }
      const res = await fetch(`/api/event-proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      setSavedAt(new Date());
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goToStep(next: number) {
    const ok = await save();
    if (!ok) return;
    setStep(Math.max(1, Math.min(TOTAL_STEPS, next)));
  }

  async function submitForReview() {
    const ok = await save();
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/event-proposals/${proposal.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "submitted" }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submit failed");
      router.push(`/admin/events/proposals/${proposal.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function del() {
    if (!confirm("Delete this draft proposal? This can't be undone.")) return;
    const res = await fetch(`/api/event-proposals/${proposal.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/events/proposals");
    }
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);
  const isLast = step === TOTAL_STEPS;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* HEADER + progress */}
      <div>
        <Link
          href="/admin/events/proposals"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Proposals
        </Link>
        <h1 className="text-xl md:text-2xl font-heading font-black text-brand-dark">
          {proposal.title || "Untitled proposal"}
        </h1>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
          <p className="text-sm text-gray-600">
            Step {step} of {TOTAL_STEPS} · {STEP_TITLES[step - 1]}
          </p>
          <p className="text-xs text-gray-500">
            {saving
              ? "Saving…"
              : savedAt
                ? `Saved ${timeAgo(savedAt)}`
                : "Draft"}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-brand-blue/10 overflow-hidden mt-3">
          <div
            className="h-full rounded-full bg-brand-blue transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* STEP JUMPER (compact) */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {STEP_TITLES.map((t, i) => {
          const n = i + 1;
          const active = n === step;
          return (
            <button
              key={n}
              type="button"
              onClick={() => goToStep(n)}
              className={
                (active
                  ? "bg-brand-blue text-white "
                  : "bg-white text-gray-600 border border-gray-200 hover:border-brand-blue ") +
                "px-2 py-1 rounded-md font-heading font-bold uppercase tracking-widest"
              }
            >
              {n}. {t}
            </button>
          );
        })}
      </div>

      {/* STEP BODY */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 space-y-4">
        <StepContent
          step={step}
          proposal={proposal}
          update={update}
          team={team}
          funds={funds}
        />
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {saveError}
        </div>
      )}

      {/* NAV */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDelete(!showDelete)}
            className="text-xs text-gray-500 hover:text-red-700 font-heading font-bold uppercase tracking-widest inline-flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete draft
          </button>
          {showDelete && (
            <button
              type="button"
              onClick={del}
              className="text-xs bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 px-3 py-1 rounded-md font-heading font-bold uppercase tracking-widest"
            >
              Confirm delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              disabled={saving || submitting}
              className="inline-flex items-center gap-1 bg-white text-brand-dark border border-gray-200 hover:border-brand-blue px-3 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              disabled={saving || submitting}
              className="inline-flex items-center gap-1 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save &amp; next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {isLast && (
            <button
              type="button"
              onClick={submitForReview}
              disabled={saving || submitting}
              className="inline-flex items-center gap-1.5 bg-brand-green text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit for review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function timeAgo(d: Date): string {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function extractPatchForStep(
  p: EventProposal,
  step: number,
): Record<string, unknown> {
  // Send the whole set of fields the step touches. Backend PATCH is
  // whitelisted so extra keys are ignored — safe to over-send.
  switch (step) {
    case 1:
      return {
        title: p.title,
        event_types: p.event_types,
        event_type_other: p.event_type_other,
        summary: p.summary,
      };
    case 2:
      return {
        preferred_date: p.preferred_date,
        alt_date: p.alt_date,
        event_start_time: p.event_start_time,
        event_end_time: p.event_end_time,
        setup_start_time: p.setup_start_time,
        packdown_end_time: p.packdown_end_time,
      };
    case 3:
      return {
        primary_venue_name: p.primary_venue_name,
        primary_venue_address: p.primary_venue_address,
        primary_venue_type: p.primary_venue_type,
        primary_venue_notes: p.primary_venue_notes,
        alt_venue_name: p.alt_venue_name,
        alt_venue_address: p.alt_venue_address,
        alt_venue_type: p.alt_venue_type,
      };
    case 4:
      return {
        age_groups: p.age_groups,
        expected_participants: p.expected_participants,
        plus_parents_carers: p.plus_parents_carers,
        accessibility_notes: p.accessibility_notes,
      };
    case 5:
      return {
        event_aim: p.event_aim,
        objectives: p.objectives,
        learning_outcomes: p.learning_outcomes,
      };
    case 6:
      return {
        schedule: p.schedule,
        activities: p.activities,
      };
    case 7:
      return {
        event_planner_id: p.event_planner_id,
        event_facilitator_id: p.event_facilitator_id,
        event_facilitator_external: p.event_facilitator_external,
        assistant_volunteer_ids: p.assistant_volunteer_ids,
        assistant_volunteers_external: p.assistant_volunteers_external,
        staff_needed: p.staff_needed,
        ratio_adults: p.ratio_adults,
        ratio_children: p.ratio_children,
        safeguarding_practices: p.safeguarding_practices,
        safeguarding_notes: p.safeguarding_notes,
      };
    case 8:
      return {
        equipment: p.equipment,
        equipment_source: p.equipment_source,
        cost_lines: p.cost_lines,
        funding_pot_ids: p.funding_pot_ids,
      };
    case 9:
      return {
        key_risks: p.key_risks,
        contingency_plan: p.contingency_plan,
      };
    case 10:
      return {
        promotion_channels: p.promotion_channels,
        registration_method: p.registration_method,
        registration_notes: p.registration_notes,
        success_measures: p.success_measures,
        photo_video_consent_default: p.photo_video_consent_default,
      };
    default:
      return {};
  }
}

// ─── Step content router ────────────────────────────────────────

function StepContent({
  step,
  proposal: p,
  update,
  team,
  funds,
}: {
  step: number;
  proposal: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
  team: Props["team"];
  funds: Props["funds"];
}) {
  switch (step) {
    case 1:
      return <Step1Overview p={p} update={update} />;
    case 2:
      return <Step2Timing p={p} update={update} />;
    case 3:
      return <Step3Where p={p} update={update} />;
    case 4:
      return <Step4Audience p={p} update={update} />;
    case 5:
      return <Step5Purpose p={p} update={update} />;
    case 6:
      return <Step6Plan p={p} update={update} />;
    case 7:
      return <Step7Team p={p} update={update} team={team} />;
    case 8:
      return <Step8Budget p={p} update={update} funds={funds} />;
    case 9:
      return <Step9Risk p={p} update={update} />;
    case 10:
      return <Step10Promotion p={p} update={update} />;
    default:
      return null;
  }
}

// ─── Field primitives ────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-gray-600 font-heading font-bold uppercase tracking-widest">
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <Label>
        {label}
        {required && " *"}
      </Label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          min={min}
          step={step}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
    </label>
  );
}

function CheckboxGroup<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  values: T[];
  onChange: (next: T[]) => void;
}) {
  function toggle(v: T) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <label
              key={o.value}
              className={
                (on
                  ? "bg-brand-blue/10 border-brand-blue text-brand-dark "
                  : "bg-white border-gray-200 hover:border-brand-blue ") +
                "flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer"
              }
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(o.value)}
                className="rounded accent-brand-blue"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className={
                (on
                  ? "bg-brand-blue text-white border-brand-blue "
                  : "bg-white text-brand-dark border-gray-200 hover:border-brand-blue ") +
                "flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-md text-sm font-heading font-bold cursor-pointer"
              }
            >
              <input
                type="radio"
                checked={on}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Dynamic add-row list of strings — for objectives, outcomes, equipment,
// success measures. Keeps a "+ Add" row always at the bottom.
function StringList({
  label,
  values,
  onChange,
  placeholder,
  maxRows = 20,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  maxRows?: number;
}) {
  function setRow(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(values.filter((_, x) => x !== i));
  }
  function add() {
    if (values.length >= maxRows) return;
    onChange([...values, ""]);
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <ul className="space-y-1.5">
        {values.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 shrink-0">
              {i + 1}.
            </span>
            <input
              type="text"
              value={v}
              onChange={(e) => setRow(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-700 p-1"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-xs text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        + Add another
      </button>
    </div>
  );
}

// ─── Step components ────────────────────────────────────────────

function Step1Overview({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <TextField
        label="Event name"
        value={p.title}
        onChange={(v) => update("title", v)}
        placeholder="e.g. Summer Fun Day: Active Minds & Big Smiles"
        required
      />
      <CheckboxGroup<EventType>
        label="Event type (tick all that apply)"
        options={EVENT_TYPE_OPTIONS}
        values={p.event_types}
        onChange={(v) => update("event_types", v)}
      />
      {p.event_types.includes("other") && (
        <TextField
          label='If "other", describe'
          value={p.event_type_other}
          onChange={(v) => update("event_type_other", v)}
          placeholder="Type of event"
        />
      )}
      <TextArea
        label="Brief summary"
        value={p.summary}
        onChange={(v) => update("summary", v)}
        placeholder="In 2–3 sentences, what is the event and what will happen?"
        hint="Shown on the public event page + in board review."
        rows={4}
      />
    </>
  );
}

function Step2Timing({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <Label>Preferred date</Label>
          <input
            type="date"
            value={p.preferred_date ?? ""}
            onChange={(e) => update("preferred_date", e.target.value || null)}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <Label>Alternative date (backup)</Label>
          <input
            type="date"
            value={p.alt_date ?? ""}
            onChange={(e) => update("alt_date", e.target.value || null)}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="block">
          <Label>Setup starts</Label>
          <input
            type="time"
            value={p.setup_start_time ?? ""}
            onChange={(e) => update("setup_start_time", e.target.value || null)}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <Label>Event starts</Label>
          <input
            type="time"
            value={p.event_start_time ?? ""}
            onChange={(e) => update("event_start_time", e.target.value || null)}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <Label>Event ends</Label>
          <input
            type="time"
            value={p.event_end_time ?? ""}
            onChange={(e) => update("event_end_time", e.target.value || null)}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <Label>Pack down ends</Label>
          <input
            type="time"
            value={p.packdown_end_time ?? ""}
            onChange={(e) => update("packdown_end_time", e.target.value || null)}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-gray-500">
        We&rsquo;ll compute total duration from these on the review page.
      </p>
    </>
  );
}

function Step3Where({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <div className="space-y-3 pb-4 border-b border-gray-100">
        <p className="text-xs uppercase tracking-widest font-heading font-bold text-brand-blue">
          Primary venue
        </p>
        <TextField
          label="Venue name"
          value={p.primary_venue_name}
          onChange={(v) => update("primary_venue_name", v)}
          placeholder="e.g. Gillingham Park"
        />
        <TextArea
          label="Address"
          value={p.primary_venue_address}
          onChange={(v) => update("primary_venue_address", v)}
          rows={2}
          placeholder="Full address"
        />
        <RadioGroup<VenueType>
          label="Indoor or outdoor?"
          options={[
            { value: "indoor", label: "Indoor" },
            { value: "outdoor", label: "Outdoor" },
            { value: "both", label: "Both" },
          ]}
          value={p.primary_venue_type}
          onChange={(v) => update("primary_venue_type", v)}
        />
        <TextArea
          label="Why is this venue suitable?"
          value={p.primary_venue_notes}
          onChange={(v) => update("primary_venue_notes", v)}
          placeholder="Accessibility, transport, capacity, facilities…"
          rows={2}
        />
      </div>
      <div className="space-y-3 pt-2">
        <p className="text-xs uppercase tracking-widest font-heading font-bold text-brand-blue">
          Alternative venue (backup)
        </p>
        <TextField
          label="Backup venue name"
          value={p.alt_venue_name}
          onChange={(v) => update("alt_venue_name", v)}
          placeholder="Optional"
        />
        <TextArea
          label="Backup address"
          value={p.alt_venue_address}
          onChange={(v) => update("alt_venue_address", v)}
          rows={2}
        />
        <RadioGroup<VenueType>
          label="Backup indoor or outdoor?"
          options={[
            { value: "indoor", label: "Indoor" },
            { value: "outdoor", label: "Outdoor" },
            { value: "both", label: "Both" },
          ]}
          value={p.alt_venue_type}
          onChange={(v) => update("alt_venue_type", v)}
        />
      </div>
    </>
  );
}

function Step4Audience({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <CheckboxGroup
        label="Age group(s)"
        options={AGE_GROUP_OPTIONS}
        values={p.age_groups}
        onChange={(v) => update("age_groups", v)}
      />
      <NumberField
        label="Expected number of participants"
        value={p.expected_participants}
        onChange={(v) => update("expected_participants", v)}
        min={1}
      />
      <label className="flex items-center gap-2 text-sm text-brand-dark">
        <input
          type="checkbox"
          checked={p.plus_parents_carers}
          onChange={(e) => update("plus_parents_carers", e.target.checked)}
          className="accent-brand-blue rounded"
        />
        <span>Plus parents / carers accompanying</span>
      </label>
      <TextArea
        label="Inclusion & accessibility notes"
        value={p.accessibility_notes}
        onChange={(v) => update("accessibility_notes", v)}
        rows={3}
        placeholder="How will the event be inclusive and accessible?"
      />
    </>
  );
}

function Step5Purpose({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <TextArea
        label="Event aim"
        value={p.event_aim}
        onChange={(v) => update("event_aim", v)}
        rows={2}
        placeholder="Overall purpose of this event"
      />
      <StringList
        label="Objectives (3–5)"
        values={p.objectives}
        onChange={(v) => update("objectives", v)}
        placeholder="e.g. Encourage positive social interaction"
      />
      <StringList
        label="Learning outcomes"
        values={p.learning_outcomes}
        onChange={(v) => update("learning_outcomes", v)}
        placeholder="e.g. Demonstrate improved teamwork"
      />
    </>
  );
}

function Step6Plan({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <ScheduleEditor
        rows={p.schedule}
        onChange={(v) => update("schedule", v)}
      />
      <ActivitiesEditor
        rows={p.activities}
        onChange={(v) => update("activities", v)}
      />
    </>
  );
}

function ScheduleEditor({
  rows,
  onChange,
}: {
  rows: ScheduleRow[];
  onChange: (v: ScheduleRow[]) => void;
}) {
  function set(i: number, patch: Partial<ScheduleRow>) {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(rows.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...rows, { start: "", duration_min: 15, activity: "" }]);
  }
  return (
    <div className="space-y-1.5">
      <Label>Schedule (blocks)</Label>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[80px_80px_1fr_36px] gap-2 items-center"
          >
            <input
              type="time"
              value={r.start}
              onChange={(e) => set(i, { start: e.target.value })}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={5}
              step={5}
              value={r.duration_min}
              onChange={(e) => set(i, { duration_min: Number(e.target.value) })}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
              placeholder="min"
            />
            <input
              type="text"
              value={r.activity}
              onChange={(e) => set(i, { activity: e.target.value })}
              placeholder="e.g. Welcome + icebreakers"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-xs text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        + Add block
      </button>
    </div>
  );
}

function ActivitiesEditor({
  rows,
  onChange,
}: {
  rows: ActivityRow[];
  onChange: (v: ActivityRow[]) => void;
}) {
  function set(i: number, patch: Partial<ActivityRow>) {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(rows.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...rows, { activity: "", achieves: "" }]);
  }
  return (
    <div className="space-y-1.5">
      <Label>Activities breakdown</Label>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center"
          >
            <input
              type="text"
              value={r.activity}
              onChange={(e) => set(i, { activity: e.target.value })}
              placeholder="Activity"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              value={r.achieves}
              onChange={(e) => set(i, { achieves: e.target.value })}
              placeholder="What it achieves"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-xs text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        + Add activity
      </button>
    </div>
  );
}

function Step7Team({
  p,
  update,
  team,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
  team: Props["team"];
}) {
  const teamOptions = [
    { value: "", label: "— none —" },
    ...team.map((m) => ({
      value: m.id,
      label: m.name || m.email,
    })),
  ];
  function toggleVolunteer(id: string) {
    if (p.assistant_volunteer_ids.includes(id)) {
      update(
        "assistant_volunteer_ids",
        p.assistant_volunteer_ids.filter((x) => x !== id),
      );
    } else {
      update("assistant_volunteer_ids", [
        ...p.assistant_volunteer_ids,
        id,
      ]);
    }
  }
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <Label>Event planner</Label>
          <select
            value={p.event_planner_id ?? ""}
            onChange={(e) =>
              update("event_planner_id", e.target.value || null)
            }
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            {teamOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Label>Event facilitator</Label>
          <select
            value={p.event_facilitator_id ?? ""}
            onChange={(e) =>
              update("event_facilitator_id", e.target.value || null)
            }
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            {teamOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TextField
        label="External facilitator (if not a team member)"
        value={p.event_facilitator_external}
        onChange={(v) => update("event_facilitator_external", v)}
        placeholder="Name of the person + org"
      />
      <div>
        <Label>Assistant volunteers</Label>
        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {team.map((m) => {
            const on = p.assistant_volunteer_ids.includes(m.id);
            return (
              <label
                key={m.id}
                className={
                  (on
                    ? "bg-brand-blue/10 border-brand-blue "
                    : "bg-white border-gray-200 hover:border-brand-blue ") +
                  "flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer"
                }
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleVolunteer(m.id)}
                  className="accent-brand-blue rounded"
                />
                {m.name || m.email}
              </label>
            );
          })}
        </div>
      </div>
      <TextArea
        label="External volunteers (freeform list)"
        value={p.assistant_volunteers_external}
        onChange={(v) => update("assistant_volunteers_external", v)}
        placeholder="Names or expected count of external volunteers"
        rows={2}
      />
      <StaffNeededEditor
        rows={p.staff_needed}
        onChange={(v) => update("staff_needed", v)}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Adults in ratio"
          value={p.ratio_adults}
          onChange={(v) => update("ratio_adults", v)}
          min={1}
        />
        <NumberField
          label="Children per adult"
          value={p.ratio_children}
          onChange={(v) => update("ratio_children", v)}
          min={1}
        />
      </div>
      <CheckboxGroup
        label="Safeguarding practices in place"
        options={SAFEGUARDING_PRACTICES}
        values={p.safeguarding_practices}
        onChange={(v) => update("safeguarding_practices", v)}
      />
      <TextArea
        label="Extra safeguarding notes"
        value={p.safeguarding_notes}
        onChange={(v) => update("safeguarding_notes", v)}
        rows={2}
      />
    </>
  );
}

function StaffNeededEditor({
  rows,
  onChange,
}: {
  rows: StaffRow[];
  onChange: (v: StaffRow[]) => void;
}) {
  function set(i: number, patch: Partial<StaffRow>) {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(rows.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...rows, { role: "", count: 1 }]);
  }
  return (
    <div className="space-y-1.5">
      <Label>Staff required (by role)</Label>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_80px_36px] gap-2 items-center"
          >
            <input
              type="text"
              value={r.role}
              onChange={(e) => set(i, { role: e.target.value })}
              placeholder="Role (e.g. Activity facilitator)"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={1}
              value={r.count}
              onChange={(e) => set(i, { count: Number(e.target.value) })}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-xs text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        + Add role
      </button>
    </div>
  );
}

function Step8Budget({
  p,
  update,
  funds,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
  funds: Props["funds"];
}) {
  function toggleFund(id: string) {
    if (p.funding_pot_ids.includes(id)) {
      update("funding_pot_ids", p.funding_pot_ids.filter((x) => x !== id));
    } else {
      update("funding_pot_ids", [...p.funding_pot_ids, id]);
    }
  }
  const total = p.cost_lines.reduce((s, l) => s + (l.amount_pence ?? 0), 0);
  return (
    <>
      <StringList
        label="Equipment required"
        values={p.equipment}
        onChange={(v) => update("equipment", v)}
        placeholder="e.g. Cones, balls, first aid kit"
      />
      <TextArea
        label="Materials source"
        value={p.equipment_source}
        onChange={(v) => update("equipment_source", v)}
        rows={2}
        placeholder="Where will equipment come from?"
      />
      <CostLinesEditor
        rows={p.cost_lines}
        onChange={(v) => update("cost_lines", v)}
      />
      <p className="text-sm">
        <strong className="font-heading font-bold text-brand-dark">
          Total budget:
        </strong>{" "}
        £{(total / 100).toFixed(2)}
      </p>
      <div>
        <Label>Funding pot(s)</Label>
        {funds.length === 0 ? (
          <p className="text-xs text-gray-500 mt-1">
            No funds configured yet. Add one in the Accounting module first.
          </p>
        ) : (
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {funds.map((f) => {
              const on = p.funding_pot_ids.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={
                    (on
                      ? "bg-brand-blue/10 border-brand-blue "
                      : "bg-white border-gray-200 hover:border-brand-blue ") +
                    "flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer"
                  }
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleFund(f.id)}
                    className="accent-brand-blue rounded"
                  />
                  <span className="min-w-0 truncate">
                    <span className="font-heading font-bold text-brand-dark">
                      {f.name}
                    </span>{" "}
                    <span className="text-xs text-gray-500">
                      ({f.code})
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function CostLinesEditor({
  rows,
  onChange,
}: {
  rows: CostLine[];
  onChange: (v: CostLine[]) => void;
}) {
  function set(i: number, patch: Partial<CostLine>) {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(rows.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...rows, { item: "", amount_pence: 0 }]);
  }
  return (
    <div className="space-y-1.5">
      <Label>Cost breakdown</Label>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_100px_36px] gap-2 items-center"
          >
            <input
              type="text"
              value={r.item}
              onChange={(e) => set(i, { item: e.target.value })}
              placeholder="Line item"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">£</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={(r.amount_pence / 100).toFixed(2)}
                onChange={(e) =>
                  set(i, {
                    amount_pence: Math.round(Number(e.target.value) * 100),
                  })
                }
                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-right"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-xs text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        + Add line item
      </button>
    </div>
  );
}

function Step9Risk({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <RiskEditor
        rows={p.key_risks}
        onChange={(v) => update("key_risks", v)}
      />
      <TextArea
        label="Contingency plan"
        value={p.contingency_plan}
        onChange={(v) => update("contingency_plan", v)}
        rows={3}
        placeholder="How will you manage these risks?"
      />
    </>
  );
}

function RiskEditor({
  rows,
  onChange,
}: {
  rows: RiskRow[];
  onChange: (v: RiskRow[]) => void;
}) {
  function set(i: number, patch: Partial<RiskRow>) {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(rows.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...rows, { risk: "", likelihood: "M", impact: "M" }]);
  }
  return (
    <div className="space-y-1.5">
      <Label>Key risks</Label>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_70px_70px_36px] gap-2 items-center"
          >
            <input
              type="text"
              value={r.risk}
              onChange={(e) => set(i, { risk: e.target.value })}
              placeholder="What could go wrong?"
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
            />
            <select
              value={r.likelihood}
              onChange={(e) =>
                set(i, {
                  likelihood: e.target.value as RiskRow["likelihood"],
                })
              }
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
              title="Likelihood"
            >
              <option value="L">L likelihood</option>
              <option value="M">M likelihood</option>
              <option value="H">H likelihood</option>
            </select>
            <select
              value={r.impact}
              onChange={(e) =>
                set(i, { impact: e.target.value as RiskRow["impact"] })
              }
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm"
              title="Impact"
            >
              <option value="L">L impact</option>
              <option value="M">M impact</option>
              <option value="H">H impact</option>
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mx-auto" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="text-xs text-brand-blue hover:text-brand-dark font-heading font-bold uppercase tracking-widest"
      >
        + Add risk
      </button>
    </div>
  );
}

function Step10Promotion({
  p,
  update,
}: {
  p: EventProposal;
  update: <K extends keyof EventProposal>(k: K, v: EventProposal[K]) => void;
}) {
  return (
    <>
      <CheckboxGroup
        label="Promotion channels"
        options={PROMOTION_CHANNELS}
        values={p.promotion_channels}
        onChange={(v) => update("promotion_channels", v)}
      />
      <RadioGroup
        label="Registration method"
        options={REGISTRATION_METHODS}
        value={p.registration_method as never}
        onChange={(v) => update("registration_method", v)}
      />
      {p.registration_method &&
        p.registration_method !== "website_form" && (
          <TextField
            label="Registration link / details"
            value={p.registration_notes}
            onChange={(v) => update("registration_notes", v)}
            placeholder="Paste URL or explain"
          />
        )}
      <StringList
        label="Success measures"
        values={p.success_measures}
        onChange={(v) => update("success_measures", v)}
        placeholder="e.g. Attendance ≥ 30, positive feedback ≥ 80%"
      />
      <RadioGroup
        label="Photography consent default"
        options={[
          { value: "opt_in", label: "Opt-in required" },
          { value: "opt_out", label: "Opt-out (default allowed)" },
          { value: "none", label: "No photography" },
        ]}
        value={p.photo_video_consent_default}
        onChange={(v) =>
          update("photo_video_consent_default", v as never)
        }
      />
      <div className="bg-brand-pale/40 border border-brand-blue/20 rounded-lg p-3 mt-4 text-sm text-brand-dark">
        <p className="flex items-center gap-1.5 font-heading font-bold mb-1">
          <Check className="h-4 w-4 text-brand-green" />
          Ready to submit
        </p>
        <p className="text-xs text-gray-600">
          Hit <strong>Submit for review</strong> below and the board will get
          this in their queue. You can still edit until they approve.
        </p>
      </div>
    </>
  );
}
