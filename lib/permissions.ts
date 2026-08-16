// Central visibility rules. One place to reason about "who sees what"
// across the admin — used by both nav filters and server-side page
// guards so client hiding and server enforcement stay in sync.
//
// Add a new restricted section here → the nav filters + a `<SectionGuard>`
// wrapper handle the rest. Keep the list short: sections are coarse
// buckets, not individual pages.

import type { TeamMember } from "@/lib/supabase/types";

export type SectionKey =
  | "money"       // accounting + donations — chair + treasurer
  | "settings"    // team + roles — chair only
  | "team";       // everything else — any team member

interface Section {
  label: string;
  // Which role-hats grant access. Order doesn't matter; ANY match wins.
  visibleTo: Array<"chair" | "treasurer" | "team">;
}

const SECTIONS: Record<SectionKey, Section> = {
  team:     { label: "Team-wide",       visibleTo: ["team"] },
  money:    { label: "Money (chair + treasurer)", visibleTo: ["chair", "treasurer"] },
  settings: { label: "Settings (chair)", visibleTo: ["chair"] },
};

// Sections mapped by URL prefix. Longest prefix wins so a nested route
// picks up its own tighter rule if we add one later.
const PATH_SECTIONS: Array<{ prefix: string; section: SectionKey }> = [
  { prefix: "/admin/settings",   section: "settings" },
  { prefix: "/admin/accounting", section: "money" },
  { prefix: "/admin/donations",  section: "money" },
  // Everything else defaults to `team` — no explicit entry needed.
];

export interface Hats {
  isChair: boolean;
  isTreasurer: boolean;
  isTeam: boolean; // signed-in team member of any stripe
}

export function hatsFor(member: Pick<TeamMember, "role" | "is_treasurer"> | null): Hats {
  const isTeam = !!member;
  const isChair = member?.role === "admin";
  const isTreasurer = !!member?.is_treasurer;
  return { isChair, isTreasurer, isTeam };
}

export function canSeeSection(hats: Hats, section: SectionKey): boolean {
  const rule = SECTIONS[section];
  return rule.visibleTo.some((r) => {
    if (r === "chair") return hats.isChair;
    if (r === "treasurer") return hats.isTreasurer;
    if (r === "team") return hats.isTeam;
    return false;
  });
}

export function canSeePath(hats: Hats, pathname: string): boolean {
  const match = [...PATH_SECTIONS]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((p) => pathname === p.prefix || pathname.startsWith(p.prefix + "/"));
  if (!match) return hats.isTeam; // default: any team member
  return canSeeSection(hats, match.section);
}

// Small helper for nav renderers — return true if this nav entry should
// be visible for the given hats.
export function navVisible(hats: Hats, href: string): boolean {
  return canSeePath(hats, href);
}
