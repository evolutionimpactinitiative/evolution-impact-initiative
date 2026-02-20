import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Registration, Event } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    const { registrationId, attending } = await request.json();

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID required" }, { status: 400 });
    }

    if (!["yes", "no"].includes(attending)) {
      return NextResponse.json({ error: "Invalid attendance value" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the registration
    const { data: regData, error: regError } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single();

    if (regError || !regData) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const registration = regData as Registration & { events: Event };

    // Check if already cancelled
    if (registration.status === "cancelled") {
      return NextResponse.json({ error: "Registration already cancelled" }, { status: 400 });
    }

    // Check if event has already passed
    const eventDate = new Date(registration.events.date);
    if (eventDate < new Date()) {
      return NextResponse.json({ error: "Event has already passed" }, { status: 400 });
    }

    if (attending === "yes") {
      // Mark as confirmed attendance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("registrations")
        .update({
          attendance_confirmed: true,
          attendance_confirmed_at: new Date().toISOString(),
        })
        .eq("id", registrationId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Attendance confirmed",
        attending: true,
      });
    } else {
      // Cancel the registration
      const wasConfirmed = registration.status === "confirmed";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("registrations")
        .update({
          status: "cancelled",
          cancellation_reason: "Cannot attend (72h confirmation)",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", registrationId);

      if (updateError) {
        throw updateError;
      }

      // If the cancelled registration was confirmed, promote someone from waitlist
      if (wasConfirmed) {
        const { data: waitlistData } = await supabase
          .from("registrations")
          .select("id, parent_email, parent_name")
          .eq("event_id", registration.event_id)
          .eq("status", "waitlisted")
          .order("created_at", { ascending: true })
          .limit(1);

        type WaitlistReg = { id: string; parent_email: string; parent_name: string };
        const waitlistRegs = (waitlistData as WaitlistReg[] | null) || [];

        if (waitlistRegs.length > 0) {
          const promoted = waitlistRegs[0];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("registrations")
            .update({ status: "confirmed" })
            .eq("id", promoted.id);

          // TODO: Send promotion email to the promoted registrant
        }
      }

      return NextResponse.json({
        success: true,
        message: "Registration cancelled",
        attending: false,
      });
    }
  } catch (error) {
    console.error("Attendance confirmation error:", error);
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 });
  }
}

// GET endpoint to verify registration for the confirmation page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Registration ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: regData, error } = await supabase
      .from("registrations")
      .select(`
        id,
        status,
        parent_name,
        parent_email,
        attendance_confirmed,
        events (
          id,
          title,
          date,
          start_time,
          venue_name
        ),
        registration_children (
          child_name,
          child_age
        )
      `)
      .eq("id", id)
      .single();

    if (error || !regData) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ registration: regData });
  } catch (error) {
    console.error("Get registration error:", error);
    return NextResponse.json({ error: "Failed to get registration" }, { status: 500 });
  }
}
