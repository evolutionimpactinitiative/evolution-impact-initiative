import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { volunteerApplicationReceivedEmail } from "@/lib/email/festival-templates";
import { FESTIVAL, FESTIVAL_SLUG } from "@/lib/festival";

interface ApplyRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  isOver18?: boolean;
  availability?: {
    setup?: boolean;
    am?: boolean;
    pm?: boolean;
    packdown?: boolean;
  };
  tShirtSize?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  dietaryRequirements?: string;
  accessibilityNeeds?: string;
  skills?: string;
  priorExperience?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consent?: boolean;
}

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    // Deadline: same as vendor/sponsor — allows the team to plan
    const now = new Date();
    const deadline = new Date(`${FESTIVAL.applicationDeadline}T23:59:59`);
    if (now > deadline) {
      return NextResponse.json(
        { error: "Volunteer applications closed on 18 July 2026." },
        { status: 410 },
      );
    }

    const body: ApplyRequest = await request.json();
    const {
      fullName,
      email,
      phone,
      isOver18,
      availability,
      tShirtSize,
      dietaryRequirements,
      accessibilityNeeds,
      skills,
      priorExperience,
      emergencyContactName,
      emergencyContactPhone,
      consent,
    } = body;

    if (
      !isString(fullName) ||
      !isString(email) ||
      !isString(phone) ||
      !isString(emergencyContactName) ||
      !isString(emergencyContactPhone)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (name, email, phone, emergency contact)",
        },
        { status: 400 },
      );
    }
    if (!consent) {
      return NextResponse.json(
        { error: "Please accept the declaration to continue" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("slug", FESTIVAL_SLUG)
      .maybeSingle();
    if (!eventRow) {
      return NextResponse.json(
        { error: "Festival event is not configured yet — please try again shortly." },
        { status: 503 },
      );
    }
    const eventId = (eventRow as { id: string }).id;

    const validSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const validatedSize =
      tShirtSize && validSizes.includes(tShirtSize) ? tShirtSize : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from("festival_volunteers")
      .insert({
        event_id: eventId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        is_over_18: isOver18 !== false,
        availability: {
          setup: !!availability?.setup,
          am: !!availability?.am,
          pm: !!availability?.pm,
          packdown: !!availability?.packdown,
        },
        t_shirt_size: validatedSize,
        dietary_requirements: isString(dietaryRequirements)
          ? dietaryRequirements.trim()
          : null,
        accessibility_needs: isString(accessibilityNeeds)
          ? accessibilityNeeds.trim()
          : null,
        skills: isString(skills) ? skills.trim() : null,
        prior_experience: isString(priorExperience)
          ? priorExperience.trim()
          : null,
        emergency_contact_name: emergencyContactName.trim(),
        emergency_contact_phone: emergencyContactPhone.trim(),
        consent_to_contact: !!consent,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      console.error("[volunteer-apply] insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 },
      );
    }

    // Send received email
    try {
      const resend = getResendClient();
      if (resend) {
        const { subject, html } = volunteerApplicationReceivedEmail({
          volunteer: {
            full_name: inserted.full_name,
            availability: inserted.availability,
            t_shirt_size: inserted.t_shirt_size,
          },
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: inserted.email,
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          email_type: "volunteer_application_received",
          recipient_email: inserted.email,
          subject,
          sent_at: new Date().toISOString(),
          status: "sent",
        });
      }
    } catch (err) {
      console.error("[volunteer-apply] email error (non-fatal):", err);
    }

    return NextResponse.json({
      success: true,
      volunteerId: inserted.id,
    });
  } catch (err) {
    console.error("[volunteer-apply] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
