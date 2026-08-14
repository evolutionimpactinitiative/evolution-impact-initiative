// Maps an approved proposal → a linked draft event row. Called from the
// approve status transition. Idempotent at the caller: if the proposal
// already has spawned_event_id set, we skip this and reuse it.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventProposal } from "./types";

// Proposal categories don't line up 1:1 with the events table's category
// enum, so we map — first matching event_type wins.
const CATEGORY_MAP: Record<string, string> = {
  creative: "creative",
  sports: "sport",
  workshop: "workshop",
  family: "family",
  educational: "training",
  community: "community",
  outreach: "community",
  other: "community",
};

function pickCategory(eventTypes: string[]): string {
  for (const t of eventTypes) {
    if (CATEGORY_MAP[t]) return CATEGORY_MAP[t];
  }
  return "community";
}

// Age groups → event_type bucket. The events table uses a coarser split
// (children/adults/mixed) than the proposal wizard, so we condense.
function pickEventType(ageGroups: string[]): "children" | "adults" | "mixed" {
  if (ageGroups.length === 0) return "mixed";
  const child = new Set(["0-5", "6-12", "13-17"]);
  const adult = new Set(["18-25", "26+"]);
  const hasChild = ageGroups.some((a) => child.has(a));
  const hasAdult = ageGroups.some((a) => adult.has(a));
  if (hasChild && !hasAdult) return "children";
  if (hasAdult && !hasChild) return "adults";
  return "mixed";
}

// TIME columns want HH:MM:SS. The wizard collects freeform "HH:MM".
function padTime(v: string | null): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

function baseSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const year = new Date().getFullYear();
  return `${base || "event"}-${year}`;
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function buildDescription(p: EventProposal): string {
  const bits: string[] = [];
  if (p.summary) bits.push(p.summary);
  if (p.event_aim) bits.push(`\n\n**Aim:** ${p.event_aim}`);
  if (p.objectives.length) {
    bits.push(
      `\n\n**Objectives:**\n${p.objectives.map((o) => `• ${o}`).join("\n")}`,
    );
  }
  if (p.learning_outcomes.length) {
    bits.push(
      `\n\n**Learning outcomes:**\n${p.learning_outcomes
        .map((o) => `• ${o}`)
        .join("\n")}`,
    );
  }
  return bits.join("").trim();
}

function ageGroupLabel(ageGroups: string[]): string | null {
  if (!ageGroups.length) return null;
  const map: Record<string, string> = {
    "0-5": "0–5",
    "6-12": "6–12",
    "13-17": "13–17",
    "18-25": "18–25",
    "26+": "26+",
    mixed: "All ages",
  };
  return ageGroups.map((a) => map[a] ?? a).join(", ");
}

function equipmentSummary(p: EventProposal): string | null {
  if (!p.equipment.length) return null;
  return p.equipment.slice(0, 8).join(", ");
}

export interface SpawnedEvent {
  id: string;
  slug: string;
}

export async function spawnEventFromProposal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  proposal: EventProposal,
): Promise<SpawnedEvent> {
  const category = pickCategory(proposal.event_types);
  const eventType = pickEventType(proposal.age_groups);

  const today = new Date();
  today.setDate(today.getDate() + 30);
  const fallbackDate = today.toISOString().slice(0, 10);

  const insertBase = {
    title: proposal.title,
    short_description:
      (proposal.summary ?? "").slice(0, 300) || "Draft — details TBC",
    full_description: buildDescription(proposal) || null,
    category,
    event_type: eventType,
    date: proposal.preferred_date || fallbackDate,
    start_time: padTime(proposal.event_start_time) ?? "10:00:00",
    end_time: padTime(proposal.event_end_time),
    arrival_time: padTime(proposal.setup_start_time),
    venue_name: proposal.primary_venue_name || "TBC",
    venue_address: proposal.primary_venue_address || "TBC",
    age_group: ageGroupLabel(proposal.age_groups),
    total_slots: proposal.expected_participants ?? 20,
    accessibility_info: proposal.accessibility_notes,
    what_to_bring: equipmentSummary(proposal),
    status: "draft" as const,
    registration_status: "auto" as const,
    created_by: proposal.created_by,
  };

  // Try to insert with the base slug; on unique-violation, retry with a
  // short random suffix. Cap the retries so a runaway hot title can't
  // spin forever.
  const base = baseSlug(proposal.title);
  const candidates = [base, `${base}-${shortSuffix()}`, `${base}-${shortSuffix()}`];
  let lastError: unknown = null;
  for (const slug of candidates) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("events")
      .insert({ ...insertBase, slug })
      .select("id, slug")
      .single();
    if (!error && data) {
      return { id: data.id as string, slug: data.slug as string };
    }
    lastError = error;
    // 23505 = unique_violation on Postgres — retry with a fresher slug
    const code = (error as { code?: string } | null)?.code;
    if (code !== "23505") break;
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to spawn event from proposal");
}
