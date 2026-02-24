import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { notificationSignupConfirmationEmail } from "@/lib/email/templates";
import type { Event } from "@/lib/supabase/types";

interface NotificationSignupRequest {
  eventId: string;
  email: string;
  name?: string | null;
  subscribeToNewsletter?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationSignupRequest = await request.json();
    const { eventId, email, name, subscribeToNewsletter = false } = body;

    // Validate required fields
    if (!eventId || !email) {
      return NextResponse.json(
        { error: "Event ID and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify event exists and is scheduled
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    const event = eventData as Event | null;

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check event is published and has a scheduled publish_at time in the future
    if (event.status !== "published") {
      return NextResponse.json(
        { error: "This event is not available" },
        { status: 400 }
      );
    }

    if (!event.publish_at || new Date(event.publish_at) <= new Date()) {
      return NextResponse.json(
        { error: "Registration is already open for this event" },
        { status: 400 }
      );
    }

    // Insert notification signup (upsert to handle duplicates gracefully)
    const { error: insertError } = await supabase
      .from("event_notifications")
      .upsert(
        {
          event_id: eventId,
          email: email.toLowerCase(),
          name: name || null,
          subscribe_to_newsletter: subscribeToNewsletter,
        },
        {
          onConflict: "event_id,email",
          ignoreDuplicates: false,
        }
      );

    if (insertError) {
      console.error("Error inserting notification signup:", insertError);
      throw insertError;
    }

    // Send confirmation email
    try {
      const resend = getResendClient();
      if (resend) {
        const emailData = notificationSignupConfirmationEmail(
          name || null,
          email.toLowerCase(),
          event
        );
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email.toLowerCase(),
          replyTo: REPLY_TO_EMAIL,
          subject: emailData.subject,
          html: emailData.html,
        });

        // Log the email
        await supabase.from("email_logs").insert({
          event_id: eventId,
          email_type: "notification_signup_confirmation",
          recipient_email: email.toLowerCase(),
          subject: emailData.subject,
          sent_at: new Date().toISOString(),
          status: "sent",
        });
      }
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the signup, just log the error
    }

    // If user opted into newsletter, also add to mailing list
    if (subscribeToNewsletter) {
      const { error: mailingListError } = await supabase
        .from("mailing_list")
        .upsert(
          {
            email: email.toLowerCase(),
            name: name || null,
            source: "event",
            status: "active",
            subscribed_at: new Date().toISOString(),
          },
          {
            onConflict: "email",
            ignoreDuplicates: true,
          }
        );

      if (mailingListError) {
        console.error("Error adding to mailing list:", mailingListError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: "You will be notified when registration opens",
    });
  } catch (error) {
    console.error("Notification signup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign up for notifications" },
      { status: 500 }
    );
  }
}
