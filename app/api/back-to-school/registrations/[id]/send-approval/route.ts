import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { registrationApprovedEmail } from "@/lib/email/back-to-school-templates";
import { generateQrToken } from "@/lib/back-to-school/qr";

type ChildRow = {
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  needs: string[] | null;
  display_order: number;
};

type Row = {
  id: string;
  parent_name: string;
  parent_email: string;
  qr_token: string | null;
  status: string;
  registration_children: ChildRow[];
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
        { error: "Email service not configured" },
        { status: 503 },
      );
    }

    const { data: reg } = await supabase
      .from("registrations")
      .select(
        `id, parent_name, parent_email, qr_token, status,
         registration_children ( child_name, child_age, uniform_size, needs, display_order )`,
      )
      .eq("id", id)
      .maybeSingle();
    const registration = reg as Row | null;
    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }
    if (registration.status !== "approved") {
      return NextResponse.json(
        { error: "Registration must be approved before sending" },
        { status: 400 },
      );
    }

    const token = registration.qr_token || generateQrToken();
    if (!registration.qr_token) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("registrations")
        .update({ qr_token: token })
        .eq("id", registration.id);
    }

    const sortedChildren = [...(registration.registration_children ?? [])].sort(
      (a, b) => a.display_order - b.display_order,
    );

    const { subject, html, attachments } = await registrationApprovedEmail({
      parentName: registration.parent_name,
      qrToken: token,
      children: sortedChildren.map((c) => ({
        child_name: c.child_name,
        child_age: c.child_age,
        uniform_size: c.uniform_size,
        needs: c.needs,
      })),
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: registration.parent_email,
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
      .eq("id", registration.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("email_logs").insert({
      registration_id: registration.id,
      email_type: "back_to_school_registration_approved",
      recipient_email: registration.parent_email,
      subject,
      sent_at: new Date().toISOString(),
      status: "sent",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[b2s-send-approval-one] handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
