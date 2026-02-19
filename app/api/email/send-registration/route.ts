import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import {
  registrationConfirmationEmail,
  waitlistConfirmationEmail,
} from "@/lib/email/templates";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json();

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get registration with children
    const { data: registrationData, error: regError } = await supabase
      .from("registrations")
      .select(`
        *,
        registration_children (*)
      `)
      .eq("id", registrationId)
      .single();

    if (regError || !registrationData) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const registration = registrationData as RegistrationWithChildren;

    // Get event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", registration.event_id)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = eventData as Event;

    // Generate email based on registration status
    const isWaitlisted = registration.status === "waitlisted";
    const emailData = isWaitlisted
      ? waitlistConfirmationEmail(registration, event)
      : registrationConfirmationEmail(registration, event);

    // Send email
    const resend = getResendClient();
    if (!resend) {
      console.log("RESEND_API_KEY not set, skipping email send");
      console.log("Would send to:", registration.parent_email);
      console.log("Subject:", emailData.subject);
      return NextResponse.json({ success: true, skipped: true });
    }

    const { data, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: registration.parent_email,
      replyTo: REPLY_TO_EMAIL,
      subject: emailData.subject,
      html: emailData.html,
    });

    if (sendError) {
      console.error("Failed to send email:", sendError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Log email in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("email_logs").insert({
      registration_id: registrationId,
      email_type: isWaitlisted ? "waitlist_confirmation" : "registration_confirmation",
      recipient_email: registration.parent_email,
      subject: emailData.subject,
      sent_at: new Date().toISOString(),
      status: "sent",
      resend_id: data?.id,
    });

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
