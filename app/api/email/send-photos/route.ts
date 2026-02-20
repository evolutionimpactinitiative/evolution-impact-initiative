import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { eventPhotosEmail } from "@/lib/email/templates";
import type { Event } from "@/lib/supabase/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventData as Event;

    if (!event.photo_album_url) {
      return NextResponse.json(
        { error: "No photo album URL set for this event" },
        { status: 400 }
      );
    }

    // Get all confirmed/attended registrations for this event
    const { data: registrationsData, error: regError } = await supabase
      .from("registrations")
      .select("id, parent_name, parent_email, status")
      .eq("event_id", eventId)
      .in("status", ["confirmed", "attended"]);

    if (regError) {
      throw regError;
    }

    type RegistrationRow = {
      id: string;
      parent_name: string;
      parent_email: string;
      status: string;
    };

    const registrations = (registrationsData as RegistrationRow[] | null) || [];

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: "No attendees found for this event" },
        { status: 400 }
      );
    }

    // Send emails to all attendees
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const registration of registrations) {
      try {
        const emailContent = eventPhotosEmail(
          registration.parent_name,
          event,
          event.photo_album_url
        );

        await resend.emails.send({
          from: "Evolution Impact Initiative <noreply@evolutionimpactinitiative.co.uk>",
          to: registration.parent_email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `Failed to send to ${registration.parent_email}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Photos email sent to ${results.sent} attendees`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("Send photos email error:", error);
    return NextResponse.json(
      { error: "Failed to send photos email" },
      { status: 500 }
    );
  }
}
