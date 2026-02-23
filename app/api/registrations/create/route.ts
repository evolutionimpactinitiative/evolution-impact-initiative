import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ChildData {
  name: string;
  age: string;
}

interface AttendeeData {
  name: string;
  email: string;
  phone: string;
}

interface RegistrationRequest {
  eventId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  accessibilityRequirements?: string;
  howHeardAboutUs?: string;
  consentChecked: boolean;
  customResponses?: Record<string, string | boolean | number>;
  children?: ChildData[];
  attendees?: AttendeeData[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RegistrationRequest = await request.json();

    const {
      eventId,
      parentName,
      parentEmail,
      parentPhone,
      accessibilityRequirements,
      howHeardAboutUs,
      consentChecked,
      customResponses,
      children = [],
      attendees = [],
    } = body;

    // Validate required fields
    if (!eventId || !parentName || !parentEmail || !parentPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!consentChecked) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check availability
    const { data: currentRegistrations } = await supabase
      .from("registrations")
      .select("status")
      .eq("event_id", eventId);

    type RegStatus = { status: string };
    const regs = (currentRegistrations as RegStatus[] | null) || [];
    const confirmedCount = regs.filter((r) => r.status === "confirmed").length;
    const waitlistedCount = regs.filter((r) => r.status === "waitlisted").length;

    const spotsRemaining = event.total_slots - confirmedCount;
    const waitlistRemaining = event.waitlist_slots - waitlistedCount;

    let status: "confirmed" | "waitlisted";
    if (spotsRemaining > 0) {
      status = "confirmed";
    } else if (waitlistRemaining > 0) {
      status = "waitlisted";
    } else {
      return NextResponse.json(
        { error: "Sorry, this event is now fully booked. Please check other events." },
        { status: 400 }
      );
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id: eventId,
        parent_name: parentName.trim(),
        parent_email: parentEmail.trim().toLowerCase(),
        parent_phone: parentPhone.trim(),
        accessibility_requirements: accessibilityRequirements?.trim() || null,
        how_heard_about_us: howHeardAboutUs?.trim() || null,
        photo_video_consent: consentChecked,
        terms_accepted_at: new Date().toISOString(),
        status,
        custom_responses: customResponses && Object.keys(customResponses).length > 0 ? customResponses : null,
      })
      .select()
      .single();

    if (regError) {
      console.error("Registration insert error:", regError);
      throw regError;
    }

    // Filter valid children and attendees
    const validChildren = children.filter((c) => c.name?.trim() && c.age?.trim());
    const validAttendees = attendees.filter((a) => a.name?.trim());

    // Add children (for children and mixed events)
    if (validChildren.length > 0) {
      const childrenToInsert = validChildren.map((child, index) => ({
        registration_id: registration.id,
        child_name: child.name.trim(),
        child_age: parseInt(child.age),
        display_order: index,
      }));

      const { error: childError } = await supabase
        .from("registration_children")
        .insert(childrenToInsert);

      if (childError) {
        console.error("Children insert error:", childError);
        throw childError;
      }
    }

    // Add attendees (for adult and mixed events)
    if (validAttendees.length > 0) {
      const attendeesToInsert = validAttendees.map((attendee, index) => ({
        registration_id: registration.id,
        attendee_name: attendee.name.trim(),
        attendee_email: attendee.email?.trim() || null,
        attendee_phone: attendee.phone?.trim() || null,
        display_order: index,
      }));

      const { error: attendeeError } = await supabase
        .from("registration_attendees")
        .insert(attendeesToInsert);

      if (attendeeError) {
        console.error("Attendees insert error:", attendeeError);
        throw attendeeError;
      }
    }

    // Send confirmation email
    try {
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl && process.env.VERCEL_URL) {
        siteUrl = `https://${process.env.VERCEL_URL}`;
      }
      if (!siteUrl) {
        siteUrl = "http://localhost:3000";
      }

      console.log("Sending email to:", `${siteUrl}/api/email/send-registration`);

      const emailResponse = await fetch(`${siteUrl}/api/email/send-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registration.id }),
      });

      const emailResult = await emailResponse.json();
      console.log("Email API response:", emailResponse.status, emailResult);

      if (!emailResponse.ok) {
        console.error("Email send failed:", emailResult);
      }
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      status,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create registration" },
      { status: 500 }
    );
  }
}
