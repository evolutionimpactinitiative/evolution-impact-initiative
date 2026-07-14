import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import {
  sponsorInquiryReceivedEmail,
  sponsorInquiryAdminEmail,
} from "@/lib/email/back-to-school-templates";

interface Payload {
  businessName?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  tier?: string;
  amountGbp?: number;
  message?: string;
  consent?: boolean;
}

const VALID_TIERS = [
  "friend",
  "bronze",
  "silver",
  "gold",
  "family",
  "champion",
  "major",
  "title",
  "custom",
  "undecided",
] as const;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;

    if (
      !isNonEmptyString(body.businessName) ||
      !isNonEmptyString(body.contactName) ||
      !isNonEmptyString(body.contactEmail) ||
      !isNonEmptyString(body.contactPhone)
    ) {
      return NextResponse.json(
        { error: "Please fill in business name, your name, email and phone." },
        { status: 400 },
      );
    }
    if (
      !body.tier ||
      !VALID_TIERS.includes(body.tier as (typeof VALID_TIERS)[number])
    ) {
      return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
    }
    if (body.tier === "custom") {
      if (
        typeof body.amountGbp !== "number" ||
        !Number.isFinite(body.amountGbp) ||
        body.amountGbp < 1
      ) {
        return NextResponse.json(
          { error: "Please give a valid custom amount." },
          { status: 400 },
        );
      }
    }
    if (body.consent !== true) {
      return NextResponse.json(
        { error: "Please tick the consent box to continue." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from("back_to_school_sponsor_inquiries")
      .insert({
        business_name: body.businessName.trim(),
        contact_name: body.contactName.trim(),
        contact_role: isNonEmptyString(body.contactRole)
          ? body.contactRole.trim()
          : null,
        contact_email: body.contactEmail.trim().toLowerCase(),
        contact_phone: body.contactPhone.trim(),
        tier: body.tier,
        amount_gbp:
          body.tier === "custom"
            ? Math.round(body.amountGbp!)
            : null,
        message: isNonEmptyString(body.message) ? body.message.trim() : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[b2s-sponsor-inquiry] insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save inquiry. Please try again." },
        { status: 500 },
      );
    }

    // Confirmation to sponsor + admin notification — non-fatal if fail
    try {
      const resend = getResendClient();
      if (resend) {
        // 1. Sponsor confirmation
        const { subject, html } = sponsorInquiryReceivedEmail({
          contactName: body.contactName.trim(),
          businessName: body.businessName.trim(),
          tier: body.tier,
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: body.contactEmail.trim().toLowerCase(),
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          email_type: "back_to_school_sponsor_inquiry_received",
          recipient_email: body.contactEmail.trim().toLowerCase(),
          subject,
          sent_at: new Date().toISOString(),
          status: "sent",
        });

        // 2. Admin notification
        const admin = sponsorInquiryAdminEmail({
          businessName: body.businessName.trim(),
          contactName: body.contactName.trim(),
          contactRole: body.contactRole?.trim() || null,
          contactEmail: body.contactEmail.trim(),
          contactPhone: body.contactPhone.trim(),
          tier: body.tier,
          amountGbp:
            body.tier === "custom" ? Math.round(body.amountGbp!) : null,
          message: body.message?.trim() || null,
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: REPLY_TO_EMAIL,
          subject: admin.subject,
          html: admin.html,
        });
      }
    } catch (err) {
      console.error("[b2s-sponsor-inquiry] email error (non-fatal):", err);
    }

    return NextResponse.json({
      success: true,
      inquiryId: (inserted as { id: string }).id,
    });
  } catch (err) {
    console.error("[b2s-sponsor-inquiry] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
