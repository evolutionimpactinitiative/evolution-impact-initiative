"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateStewardToken } from "@/lib/festival/check-in";
import { B2S_SLUG } from "@/lib/back-to-school";

// Steward tokens for the Back to School Drive. Shares the same
// `festival_steward_tokens` table as the festival — event_id keeps them
// separate. The URL builder for these is /b2s/scan/{token} (see
// b2sStewardScanUrl in lib/back-to-school/steward.ts).

type ActionResult = { ok: true; token?: string } | { ok: false; error: string };

async function getCreatedBy(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (member as any)?.id ?? null;
}

export async function createB2SStewardToken(
  label: string,
): Promise<ActionResult> {
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Please give the token a label" };

  const createdBy = await getCreatedBy();
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  if (!eventRow) {
    return {
      ok: false,
      error: "Back to School event not configured yet.",
    };
  }
  const eventId = (eventRow as { id: string }).id;

  const token = generateStewardToken();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("festival_steward_tokens")
    .insert({
      event_id: eventId,
      token,
      label: trimmed,
      created_by: createdBy,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/back-to-school/stewards");
  return { ok: true, token };
}

export async function revokeB2SStewardToken(
  id: string,
): Promise<ActionResult> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("festival_steward_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/back-to-school/stewards");
  return { ok: true };
}
