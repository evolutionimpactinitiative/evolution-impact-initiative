import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, publish_at, status")
      .eq("id", eventId)
      .single();

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
