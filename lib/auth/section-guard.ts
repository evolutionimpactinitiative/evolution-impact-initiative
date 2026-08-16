// Server-side helper for section-level guards. Import into a layout for
// a restricted area (accounting, donations, settings) so every page
// under the tree checks visibility before rendering.

import { createClient } from "@/lib/supabase/server";
import { canSeeSection, hatsFor, type SectionKey } from "@/lib/permissions";

export interface SectionCheck {
  ok: boolean;
  hats: ReturnType<typeof hatsFor>;
  memberId: string | null;
}

export async function checkSection(section: SectionKey): Promise<SectionCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, hats: hatsFor(null), memberId: null };

  const { data: memberRow } = await supabase
    .from("team_members")
    .select("id, role, is_treasurer")
    .eq("email", user.email || "")
    .maybeSingle();
  const member = memberRow as
    | { id: string; role: "admin" | "editor" | "treasurer"; is_treasurer: boolean }
    | null;

  const hats = hatsFor(member);
  return {
    ok: canSeeSection(hats, section),
    hats,
    memberId: member?.id ?? null,
  };
}
