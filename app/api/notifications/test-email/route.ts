import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { registrationOpenEmail } from "@/lib/email/templates";
import type { Event } from "@/lib/supabase/types";

// Test endpoint to preview the "Registration is Open" email
export async function POST(request: NextRequest) {
  try {
    const { email, name, eventId } = await request.json();

    if (!email || !eventId) {
      return NextResponse.json(
        { error: "Email and eventId are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = eventData as Event;

    // Generate the email
    const emailData = registrationOpenEmail(
      name || "Test User",
      email,
      event
    );

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Send the test email
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO_EMAIL,
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html,
    });

    if (sendError) {
      console.error("Failed to send test email:", sendError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
