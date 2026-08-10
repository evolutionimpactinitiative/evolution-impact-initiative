import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getResendClient,
  FROM_EMAIL,
  REPLY_TO_EMAIL,
} from "@/lib/email/resend";
import { waitlistPromotedEmail } from "@/lib/email/back-to-school-templates";

// POST /api/back-to-school/registrations/[id]/promote
//
// Moves a waitlisted registration into pending (the normal approval queue).
// Only registrations currently on the waitlist can be promoted; if they're
// already pending/approved/collected we return a soft 200 no-op so the UI
// doesn't complain if the admin double-clicks.
//
// Sends a "great news, a place has opened up" email — the final approval
// email with QR code still gets sent on 21 Aug via the normal blast.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Look the registration up first so we know the parent's details for the
    // email and can no-op cleanly if it's already been promoted.
    const admin = createAdminClient();
    const { data: regRow } = await admin
      .from("registrations")
      .select("id, status, parent_name, parent_email")
      .eq("id", id)
      .maybeSingle();
    const reg = regRow as {
      id: string;
      status: string;
      parent_name: string | null;
      parent_email: string | null;
    } | null;

    if (!reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    if (reg.status !== "waitlisted") {
      // Already promoted / approved / etc — treat as idempotent success.
      return NextResponse.json({
        success: true,
        status: reg.status,
        promoted: false,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("registrations")
      .update({ status: "pending" })
      .eq("id", id);
    if (updateErr) {
      console.error("[b2s-promote] update err:", updateErr);
      return NextResponse.json(
        { error: "Failed to promote" },
        { status: 500 },
      );
    }

    // Count kids for the email copy.
    const { count: kidsCount } = await admin
      .from("registration_children")
      .select("id", { count: "exact", head: true })
      .eq("registration_id", id);

    // Send the promotion email — non-fatal if it fails.
    if (reg.parent_email) {
      try {
        const resend = getResendClient();
        if (resend) {
          const { subject, html } = waitlistPromotedEmail({
            parentName: reg.parent_name || "there",
            childrenCount: kidsCount ?? 1,
          });
          await resend.emails.send({
            from: FROM_EMAIL,
            to: reg.parent_email,
            replyTo: REPLY_TO_EMAIL,
            subject,
            html,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any).from("email_logs").insert({
            registration_id: id,
            email_type: "back_to_school_waitlist_promoted",
            recipient_email: reg.parent_email,
            subject,
            sent_at: new Date().toISOString(),
            status: "sent",
          });
        }
      } catch (err) {
        console.error("[b2s-promote] email err (non-fatal):", err);
      }
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      promoted: true,
    });
  } catch (err) {
    console.error("[b2s-promote] handler err:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
