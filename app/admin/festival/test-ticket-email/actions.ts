"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { festivalTicketsEmail } from "@/lib/email/festival-templates";
import {
  createTicketsForRegistration,
  ticketUrl,
} from "@/lib/festival/tickets";
import { FESTIVAL_SLUG } from "@/lib/festival";

interface TestParams {
  email: string;
  parentName?: string;
  childrenCount?: number;
  adultCount?: number;
}

type ActionResult =
  | {
      ok: true;
      registrationId: string;
      ticketCount: number;
      ticketUrls: string[];
      sent: boolean;
    }
  | { ok: false; error: string };

export async function sendTestTicketEmail(
  params: TestParams,
): Promise<ActionResult> {
  // Gate to authed admins only
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated" };
  const { data: member } = await server
    .from("team_members")
    .select("id, name, email")
    .eq("email", user.email)
    .maybeSingle();
  if (!member) return { ok: false, error: "Not authorised" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviewer = member as any;

  const cleanEmail = params.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: "Please enter a valid email address" };
  }

  const parentName = params.parentName?.trim() || "Test Family";
  const childrenCount = Math.max(0, Math.min(4, params.childrenCount ?? 2));
  const adultCount = Math.max(0, Math.min(5, params.adultCount ?? 0));
  if (childrenCount === 0 && adultCount === 0) {
    return {
      ok: false,
      error: "Need at least 1 child or 1 additional adult",
    };
  }

  const admin = createAdminClient();

  // Find the festival event
  const { data: eventRow } = await admin
    .from("events")
    .select("*")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = eventRow as any;
  if (!event) {
    return {
      ok: false,
      error: "Festival event not found. Run the M1 migration first.",
    };
  }

  // Insert the test registration (tagged in admin_notes for easy cleanup)
  const adminNote = `TEST · ticket-email preview · sent by ${reviewer.email ?? "admin"} at ${new Date().toISOString()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regRow, error: regErr } = await (admin as any)
    .from("registrations")
    .insert({
      event_id: event.id,
      parent_name: parentName,
      parent_email: cleanEmail,
      parent_phone: "00000 000000",
      status: "confirmed",
      photo_video_consent: true,
      terms_accepted_at: new Date().toISOString(),
      admin_notes: adminNote,
    })
    .select()
    .single();
  if (regErr || !regRow) {
    return {
      ok: false,
      error: regErr?.message ?? "Failed to insert test registration",
    };
  }

  // Add sample children + adults
  const childrenInserts = Array.from({ length: childrenCount }, (_, i) => ({
    registration_id: regRow.id,
    child_name: `Test Child ${i + 1}`,
    child_age: 6 + i,
    display_order: i,
  }));
  if (childrenInserts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("registration_children").insert(childrenInserts);
  }

  const attendeeInserts = Array.from({ length: adultCount }, (_, i) => ({
    registration_id: regRow.id,
    attendee_name: `Test Adult ${i + 1}`,
    display_order: i,
  }));
  if (attendeeInserts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("registration_attendees")
      .insert(attendeeInserts);
  }

  // Generate tickets
  const tickets = await createTicketsForRegistration({
    id: regRow.id,
    event_id: regRow.event_id,
    parent_name: regRow.parent_name,
    registration_children: childrenInserts.map((c) => ({
      child_name: c.child_name,
      display_order: c.display_order,
    })),
    registration_attendees: attendeeInserts.map((a) => ({
      attendee_name: a.attendee_name,
      display_order: a.display_order,
    })),
  });

  const sortedTickets = tickets
    .slice()
    .sort((a, b) => a.display_order - b.display_order);

  // Build the email body
  const emailData = await festivalTicketsEmail({
    registration: {
      id: regRow.id,
      parent_name: regRow.parent_name,
      parent_email: regRow.parent_email,
    },
    event,
    tickets: sortedTickets,
  });

  // Send via Resend
  let sent = false;
  const resend = getResendClient();
  if (resend) {
    const { data: result, error: sendErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: cleanEmail,
      replyTo: REPLY_TO_EMAIL,
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html,
      attachments: emailData.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentId: a.contentId,
      })),
    });
    if (sendErr) {
      return {
        ok: false,
        error: `Email failed to send: ${sendErr.message ?? "unknown error"}`,
      };
    }
    sent = true;
    // Log it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("email_logs").insert({
      registration_id: regRow.id,
      event_id: event.id,
      email_type: "festival_tickets_test",
      recipient_email: cleanEmail,
      subject: `[TEST] ${emailData.subject}`,
      sent_at: new Date().toISOString(),
      status: "sent",
      resend_id: result?.id,
    });
  }

  revalidatePath("/admin/festival/test-ticket-email");
  revalidatePath("/admin/registrations");

  return {
    ok: true,
    registrationId: regRow.id,
    ticketCount: sortedTickets.length,
    ticketUrls: sortedTickets.map((t) => ticketUrl(t.ticket_code)),
    sent,
  };
}

export async function deleteTestRegistration(
  registrationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated" };

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("registrations")
    .delete()
    .eq("id", registrationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/festival/test-ticket-email");
  revalidatePath("/admin/registrations");
  return { ok: true };
}

/**
 * Clear every check-in on festival tickets without deleting the tickets
 * themselves — useful when you want to re-test the scanning flow against
 * the same tickets.
 */
export async function resetAllFestivalCheckIns(): Promise<
  { ok: true; cleared: number } | { ok: false; error: string }
> {
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated" };
  const { data: member } = await server
    .from("team_members")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (!member) return { ok: false, error: "Not authorised" };

  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  if (!eventRow) return { ok: false, error: "Festival event not found" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventId = (eventRow as any).id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (admin as any)
    .from("festival_tickets")
    .update({ checked_in_at: null, checked_in_by_token_id: null })
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null)
    .select("id");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/festival/check-in");
  revalidatePath("/admin/festival/test-ticket-email");
  return { ok: true, cleared: updated?.length ?? 0 };
}

/**
 * Delete every registration on the festival event — cascade removes
 * festival_tickets, registration_children, registration_attendees. Hard
 * reset for testing; only enabled until the festival is live with real
 * bookings (intentionally has no scope filter because the team-decision
 * point is the confirmation step in the UI, not here).
 */
export async function resetAllFestivalRegistrations(): Promise<
  { ok: true; deleted: number } | { ok: false; error: string }
> {
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated" };
  const { data: member } = await server
    .from("team_members")
    .select("id, role")
    .eq("email", user.email)
    .maybeSingle();
  if (!member) return { ok: false, error: "Not authorised" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (member as any).role;
  if (role !== "admin") {
    return { ok: false, error: "Only admins can reset registrations" };
  }

  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", FESTIVAL_SLUG)
    .maybeSingle();
  if (!eventRow) return { ok: false, error: "Festival event not found" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventId = (eventRow as any).id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deleted, error } = await (admin as any)
    .from("registrations")
    .delete()
    .eq("event_id", eventId)
    .select("id");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/festival/check-in");
  revalidatePath("/admin/festival/test-ticket-email");
  revalidatePath("/admin/registrations");
  revalidatePath("/evolution-fest-2026");
  return { ok: true, deleted: deleted?.length ?? 0 };
}
