import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { volunteerApplicationReceivedEmail } from "@/lib/email/festival-templates";
import { FESTIVAL, FESTIVAL_SLUG } from "@/lib/festival";
import type { DbsLevel } from "@/lib/supabase/types";

interface ApplyRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
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
  hasDbs?: boolean;
  dbsLevel?: DbsLevel;
  hasSafeguardingTraining?: boolean;
  safeguardingTrainingNotes?: string;
  parentGuardianName?: string;
  parentGuardianPhone?: string;
  parentGuardianEmail?: string;
  parentGuardianRelationship?: string;
  parentalConsentConfirmed?: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  consent?: boolean;
}

const VALID_DBS_LEVELS: DbsLevel[] = [
  "basic",
  "standard",
  "enhanced",
  "enhanced_child_barred",
  "enhanced_adult_barred",
  "enhanced_both_barred",
];

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const deadline = new Date(`${FESTIVAL.volunteerDeadline}T23:59:59`);
    if (now > deadline) {
      return NextResponse.json(
        { error: `Volunteer applications closed on ${FESTIVAL.volunteerDeadlineLabel}.` },
        { status: 410 },
      );
    }

    const body: ApplyRequest = await request.json();
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      availability,
      tShirtSize,
      dietaryRequirements,
      accessibilityNeeds,
      skills,
      priorExperience,
      hasDbs,
      dbsLevel,
      hasSafeguardingTraining,
      safeguardingTrainingNotes,
      parentGuardianName,
      parentGuardianPhone,
      parentGuardianEmail,
      parentGuardianRelationship,
      parentalConsentConfirmed,
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
    if (!isString(dateOfBirth)) {
      return NextResponse.json(
        { error: "Please enter your date of birth" },
        { status: 400 },
      );
    }
    const age = ageFromDob(dateOfBirth);
    if (age === null || age < 0 || age > 120) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth" },
        { status: 400 },
      );
    }

    // DBS: if they said yes, level must be valid
    if (hasDbs === true) {
      if (!dbsLevel || !VALID_DBS_LEVELS.includes(dbsLevel)) {
        return NextResponse.json(
          { error: "Please select a valid DBS level" },
          { status: 400 },
        );
      }
    }

    // Parental consent gate for minors — server-side re-validation
    const isMinor = age < 18;
    if (isMinor) {
      if (
        !isString(parentGuardianName) ||
        !isString(parentGuardianPhone) ||
        !isString(parentGuardianEmail) ||
        !isString(parentGuardianRelationship) ||
        parentalConsentConfirmed !== true
      ) {
        return NextResponse.json(
          {
            error:
              "Under-18 volunteers need a parent/guardian's details and consent",
          },
          { status: 400 },
        );
      }
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
        date_of_birth: dateOfBirth,
        is_over_18: age >= 18,
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
        has_dbs: typeof hasDbs === "boolean" ? hasDbs : null,
        dbs_level: hasDbs === true && dbsLevel ? dbsLevel : null,
        has_safeguarding_training:
          typeof hasSafeguardingTraining === "boolean"
            ? hasSafeguardingTraining
            : null,
        safeguarding_training_notes:
          hasSafeguardingTraining === true && isString(safeguardingTrainingNotes)
            ? safeguardingTrainingNotes.trim()
            : null,
        parent_guardian_name: isMinor ? parentGuardianName!.trim() : null,
        parent_guardian_phone: isMinor ? parentGuardianPhone!.trim() : null,
        parent_guardian_email: isMinor
          ? parentGuardianEmail!.trim().toLowerCase()
          : null,
        parent_guardian_relationship: isMinor
          ? parentGuardianRelationship!.trim()
          : null,
        parental_consent_confirmed: isMinor
          ? parentalConsentConfirmed === true
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
