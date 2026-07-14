import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { registrationApprovedEmail } from "@/lib/email/back-to-school-templates";
import { generateQrToken } from "@/lib/back-to-school/qr";
import { B2S_SLUG } from "@/lib/back-to-school";

type ChildRow = {
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  needs: string[] | null;
  uniform_choices: import("@/lib/back-to-school").UniformChoices | null;
  display_order: number;
};

type ApprovalRow = {
  id: string;
  parent_name: string;
  parent_email: string;
  qr_token: string | null;
  registration_children: ChildRow[];
};

export async function POST(_request: NextRequest) {
  try {
    // Team-member gate
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: teamMember } = await supabaseUser
      .from("team_members")
      .select("id")
      .eq("email", user.email || "")
      .maybeSingle();
    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminClient();

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 503 },
      );
    }

    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("slug", B2S_SLUG)
      .maybeSingle();
    if (!eventRow) {
      return NextResponse.json({ error: "Drive event not found" }, { status: 404 });
    }
    const eventId = (eventRow as { id: string }).id;

    const { data: registrations } = await supabase
      .from("registrations")
      .select(
        `id, parent_name, parent_email, qr_token,
         registration_children ( child_name, child_age, uniform_size, needs, uniform_choices, display_order )`,
      )
      .eq("event_id", eventId)
      .eq("status", "approved")
      .is("approval_email_sent_at", null);

    const list = (registrations as ApprovalRow[] | null) ?? [];
    if (list.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;

    // Sequential loop — avoids Resend rate limits and keeps error handling simple.
    // For 500 rows this is a couple of minutes; fine as a one-shot admin action.
    for (const reg of list) {
      try {
        const token = reg.qr_token || generateQrToken();

        // Persist token first so it's stable if the email fails
        if (!reg.qr_token) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: tokenErr } = await (supabase as any)
            .from("registrations")
            .update({ qr_token: token })
            .eq("id", reg.id);
          if (tokenErr) throw new Error(tokenErr.message);
        }

        const sortedChildren = [...(reg.registration_children ?? [])].sort(
          (a, b) => a.display_order - b.display_order,
        );

        const { subject, html, attachments } = await registrationApprovedEmail({
          parentName: reg.parent_name,
          qrToken: token,
          children: sortedChildren.map((c) => ({
            child_name: c.child_name,
            child_age: c.child_age,
            uniform_size: c.uniform_size,
            needs: c.needs,
            uniform_choices: c.uniform_choices,
          })),
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: reg.parent_email,
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentId: a.contentId,
          })),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("registrations")
          .update({ approval_email_sent_at: new Date().toISOString() })
          .eq("id", reg.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_logs").insert({
          registration_id: reg.id,
          email_type: "back_to_school_registration_approved",
          recipient_email: reg.parent_email,
          subject,
          sent_at: new Date().toISOString(),
          status: "sent",
        });

        sent++;
      } catch (err) {
        console.error(
          `[b2s-send-approvals] failed for registration ${reg.id}:`,
          err,
        );
        failed++;
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("[b2s-send-approvals] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
