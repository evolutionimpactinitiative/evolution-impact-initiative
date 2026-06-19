"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateStewardToken } from "@/lib/festival/check-in";
import { FESTIVAL_SLUG } from "@/lib/festival";

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

export async function createStewardToken(
  label: string,
): Promise<ActionResult> {
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Please give the token a label" };

  const createdBy = await getCreatedBy();
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  if (!eventRow) {
    return {
      ok: false,
      error: "Festival event not configured. Run the M1 migration.",
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

  revalidatePath("/admin/festival/check-in");
  return { ok: true, token };
}

export async function revokeStewardToken(
  id: string,
): Promise<ActionResult> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("festival_steward_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/festival/check-in");
  return { ok: true };
}

export async function undoCheckIn(
  ticketId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("festival_tickets")
    .update({
      checked_in_at: null,
      checked_in_by_token_id: null,
    })
    .eq("id", ticketId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/festival/check-in");
  return { ok: true };
}

export async function adminManualCheckIn(
  code: string,
): Promise<
  | { ok: true; status: "checked_in" | "already_checked_in"; holder: string | null; lead: string }
  | { ok: false; error: string }
> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: "Please enter a ticket code" };

  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  if (!eventRow) return { ok: false, error: "Festival event not configured" };
  const eventId = (eventRow as { id: string }).id;

  const { data: ticketRow } = await admin
    .from("festival_tickets")
    .select(
      `*, registrations!inner (parent_name)`,
    )
    .eq("ticket_code", trimmed)
    .eq("event_id", eventId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticket = ticketRow as any;
  if (!ticket) return { ok: false, error: "Ticket not found" };

  if (ticket.checked_in_at) {
    revalidatePath("/admin/festival/check-in");
    return {
      ok: true,
      status: "already_checked_in",
      holder: ticket.holder_name,
      lead: ticket.registrations?.parent_name ?? "Guest",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("festival_tickets")
    .update({ checked_in_at: new Date().toISOString() })
    .eq("id", ticket.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/festival/check-in");
  return {
    ok: true,
    status: "checked_in",
    holder: ticket.holder_name,
    lead: ticket.registrations?.parent_name ?? "Guest",
  };
}
