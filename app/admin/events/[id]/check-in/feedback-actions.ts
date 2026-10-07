"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Rating = "needs_support" | "doing_well" | "thriving";

export type FeedbackPayload = {
  settling_in: Rating | null;
  engagement: Rating | null;
  confidence: Rating | null;
  social_connection: Rating | null;
  communication: Rating | null;
  emotional_regulation: Rating | null;
  parent_child_connection: Rating | null;
  notable: string | null;
};

const VALID_RATINGS: Rating[] = ["needs_support", "doing_well", "thriving"];
function cleanRating(v: unknown): Rating | null {
  return typeof v === "string" && VALID_RATINGS.includes(v as Rating)
    ? (v as Rating)
    : null;
}

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tm } = await (admin as any)
    .from("team_members")
    .select("id, email")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) throw new Error("Team members only");
  return tm as { id: string; email: string };
}

export async function upsertChildFeedback(params: {
  childId: string;
  eventId: string;
  payload: FeedbackPayload;
}) {
  const tm = await requireTeamMember();
  const admin = createAdminClient();

  const row = {
    child_id: params.childId,
    event_id: params.eventId,
    team_member_id: tm.id,
    settling_in: cleanRating(params.payload.settling_in),
    engagement: cleanRating(params.payload.engagement),
    confidence: cleanRating(params.payload.confidence),
    social_connection: cleanRating(params.payload.social_connection),
    communication: cleanRating(params.payload.communication),
    emotional_regulation: cleanRating(params.payload.emotional_regulation),
    parent_child_connection: cleanRating(params.payload.parent_child_connection),
    notable: params.payload.notable?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("child_session_feedback")
    .upsert(row, { onConflict: "child_id,event_id" });
  if (error) throw error;

  revalidatePath(`/admin/events/${params.eventId}/check-in`);
}
