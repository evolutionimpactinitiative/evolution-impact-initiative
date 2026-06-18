import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { festivalTicketsEmail } from "@/lib/email/festival-templates";
import { createTicketsForRegistration } from "@/lib/festival/tickets";
import { FESTIVAL_SLUG } from "@/lib/festival";
import type { Event, FestivalTicket, Registration } from "@/lib/supabase/types";

type RegistrationWithRelations = Registration & {
  registration_children: { child_name: string; display_order: number }[];
  registration_attendees: { attendee_name: string; display_order: number }[];
};

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json();

    if (!registrationId) {
      return NextResponse.json(
        { error: "registrationId is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Load registration + attendees
    const { data: regRow, error: regErr } = await supabase
      .from("registrations")
      .select(
        `*, registration_children (child_name, display_order), registration_attendees (attendee_name, display_order)`,
      )
      .eq("id", registrationId)
      .single();

    if (regErr || !regRow) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }
    const registration = regRow as RegistrationWithRelations;

    // Confirm it's the festival event
    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", registration.event_id)
      .single();

    if (eventErr || !eventRow) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 },
      );
    }
    const event = eventRow as Event;
    if (event.slug !== FESTIVAL_SLUG) {
      return NextResponse.json(
        { error: "Event is not the festival" },
        { status: 400 },
      );
    }

    // Only issue tickets for confirmed registrations
    if (registration.status !== "confirmed") {
      return NextResponse.json(
        { error: `Registration status is '${registration.status}', not confirmed` },
        { status: 400 },
      );
    }

    // Idempotently create the tickets (or read existing ones)
    const tickets = await createTicketsForRegistration(
      {
        id: registration.id,
        event_id: registration.event_id,
        parent_name: registration.parent_name,
        registration_children: registration.registration_children
          .slice()
          .sort((a, b) => a.display_order - b.display_order),
        registration_attendees: registration.registration_attendees
          .slice()
          .sort((a, b) => a.display_order - b.display_order),
      },
      { client: supabase },
    );

    // Build the email
    const emailData = await festivalTicketsEmail({
      registration: {
        id: registration.id,
        parent_name: registration.parent_name,
        parent_email: registration.parent_email,
      },
      event,
      tickets: tickets.slice().sort((a, b) => a.display_order - b.display_order) as FestivalTicket[],
    });

    const resend = getResendClient();
    if (!resend) {
      console.log("[festival-tickets] RESEND_API_KEY not set — skipping email");
      console.log(
        `[festival-tickets] Would send ${tickets.length} tickets to ${registration.parent_email}`,
      );
      return NextResponse.json({
        success: true,
        skipped: true,
        ticketCount: tickets.length,
      });
    }

    const { data: sendResult, error: sendErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: registration.parent_email,
      replyTo: REPLY_TO_EMAIL,
      subject: emailData.subject,
      html: emailData.html,
      attachments: emailData.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentId: a.contentId,
      })),
    });

    if (sendErr) {
      console.error("[festival-tickets] resend send error:", sendErr);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    // Log the email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("email_logs").insert({
      registration_id: registration.id,
      event_id: event.id,
      email_type: "festival_tickets_confirmation",
      recipient_email: registration.parent_email,
      subject: emailData.subject,
      sent_at: new Date().toISOString(),
      status: "sent",
      resend_id: sendResult?.id,
    });

    // Auto-add holder to mailing list, tagged 'festival-2026'
    try {
      const lowerEmail = registration.parent_email.trim().toLowerCase();
      const { data: existing } = await supabase
        .from("mailing_list")
        .select("id, tags")
        .eq("email", lowerEmail)
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tags = ((existing as any)?.tags as string[] | undefined) ?? [];
      if (!existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("mailing_list").insert({
          email: lowerEmail,
          name: registration.parent_name,
          status: "active",
          source: "event",
          tags: ["festival-2026"],
        });
      } else if (!tags.includes("festival-2026")) {
        await supabase
          .from("mailing_list")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ tags: [...tags, "festival-2026"] } as any)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq("id", (existing as any).id);
      }
    } catch (mlErr) {
      // Non-fatal — log and continue
      console.error("[festival-tickets] mailing_list upsert error:", mlErr);
    }

    return NextResponse.json({
      success: true,
      ticketCount: tickets.length,
      emailId: sendResult?.id,
    });
  } catch (err) {
    console.error("[festival-tickets] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
