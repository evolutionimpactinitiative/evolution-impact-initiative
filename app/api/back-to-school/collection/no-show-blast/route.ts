import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { B2S_SLUG } from "@/lib/back-to-school";

async function requireTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: tm } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!tm) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

// POST /api/back-to-school/collection/no-show-blast
// Body: { subject, body, recipientIds: string[] }
// Sends the same message (with {{name}} swapped per parent) to the
// registration IDs the chair explicitly ticked. Any ID that isn't
// in the August no-show set is dropped silently — guards against a
// hand-crafted POST hitting parents from other events.
export async function POST(request: NextRequest) {
  const auth = await requireTeam();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not authorised" }, { status: auth.status });
  }
  const { subject, body, recipientIds } = (await request.json()) as {
    subject?: string;
    body?: string;
    recipientIds?: string[];
  };
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject + body required" }, { status: 400 });
  }
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one recipient." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();
  const event = eventRow as { id: string } | null;
  if (!event) {
    return NextResponse.json({ error: "August drive event not found" }, { status: 500 });
  }

  // Scope recipients to the intersection of (chair's picks) AND
  // (August no-show set) — a bad ID in the payload can't leak
  // messages to unrelated registrations.
  const { data: regs } = await admin
    .from("registrations")
    .select("id, parent_name, parent_email")
    .eq("event_id", event.id)
    .eq("cancellation_reason", "august_no_show")
    .in("id", recipientIds);
  const recipients = ((regs as { parent_name: string; parent_email: string }[] | null) ?? [])
    .filter((r) => !!r.parent_email);

  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  // Send serially — Resend has a rate limit and a small number of
  // no-shows makes concurrency needless. If we ever get > 1000
  // recipients this loop gets slow; batch/parallel then.
  for (const r of recipients) {
    const firstName = (r.parent_name.split(/\s+/)[0] || "there").trim();
    const html = body.replace(/\{\{name\}\}/g, firstName);
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO_EMAIL,
        to: r.parent_email,
        subject,
        html,
      });
      sent += 1;
    } catch (e) {
      console.error("[no-show-blast] send err:", e);
      failed += 1;
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}
