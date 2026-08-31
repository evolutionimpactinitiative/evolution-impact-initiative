import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { portalBaselineInviteEmail } from "@/lib/email/portal-templates";

// Daily cron: find every GT parent who has attended at least one
// Growing Together session (event date ≥ 24h ago) AND has no prior
// baseline outcome_invitation. Create an outcome_participant (or reuse
// one by email), create the outcome_invitation, email the branded link.
//
// GET so it works with Vercel Cron. Auth via Bearer $CRON_SECRET in prod.

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
const PROGRAMME_STRAND = "growing_together";
const INSTRUMENT_CODE = "GT_BASELINE";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instrument } = await (admin as any)
    .from("outcome_instruments")
    .select("id")
    .eq("code", INSTRUMENT_CODE)
    .maybeSingle();

  if (!instrument) {
    return NextResponse.json(
      { error: `Instrument ${INSTRUMENT_CODE} not seeded` },
      { status: 500 },
    );
  }

  // Cutoff: attended a session ≥ 24h ago.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  // Distinct parent emails from attended GT registrations that ended
  // yesterday or earlier. Overfetching is fine — we filter dupes in JS.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attRaw, error } = await (admin as any)
    .from("registrations")
    .select(
      `parent_name, parent_email,
       events!inner (date, programme)`,
    )
    .eq("attended", "yes")
    .not("family_id", "is", null)
    .eq("events.programme", "growing_together")
    .lte("events.date", cutoffDate);

  if (error) {
    console.error("GT baseline cron: fetch failed", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  type Row = {
    parent_name: string;
    parent_email: string;
    events: { date: string; programme: string | null };
  };
  const rows = (attRaw as Row[] | null) ?? [];

  // Collapse to one row per parent email.
  const byEmail = new Map<string, { name: string; email: string }>();
  for (const r of rows) {
    const em = r.parent_email.trim().toLowerCase();
    if (!byEmail.has(em)) byEmail.set(em, { name: r.parent_name, email: em });
  }

  const resend = getResendClient();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const parent of byEmail.values()) {
    // Skip if this parent already has a GT baseline invitation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin as any)
      .from("outcome_invitations")
      .select("id")
      .eq("programme_strand", PROGRAMME_STRAND)
      .eq("timepoint", "baseline")
      .eq("recipient_email", parent.email)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    // Reuse an outcome_participant row for this email if one exists,
    // else create it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingParticipant } = await (admin as any)
      .from("outcome_participants")
      .select("id")
      .eq("email", parent.email)
      .maybeSingle();

    let participantId: string;
    if (existingParticipant) {
      participantId = existingParticipant.id;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error: pErr } = await (admin as any)
        .from("outcome_participants")
        .insert({ email: parent.email, name: parent.name })
        .select("id")
        .single();
      if (pErr || !created) {
        console.error("GT baseline: participant insert failed", pErr);
        failed++;
        continue;
      }
      participantId = created.id;
    }

    const token = newToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: invErr } = await (admin as any).from("outcome_invitations").insert({
      token,
      instrument_id: instrument.id,
      participant_id: participantId,
      context_label: "Growing Together — first attendance",
      programme_strand: PROGRAMME_STRAND,
      timepoint: "baseline",
      recipient_email: parent.email,
      email_sent_at: new Date().toISOString(),
    });
    if (invErr) {
      console.error("GT baseline: invitation insert failed", invErr);
      failed++;
      continue;
    }

    const url = `${BASE_URL}/outcomes/${token}`;
    const { subject, html } = portalBaselineInviteEmail({
      name: parent.name.split(/\s+/)[0] || parent.name,
      url,
    });

    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: parent.email,
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("email_logs").insert({
          recipient_email: parent.email,
          email_type: "gt_baseline_invite",
          subject,
          status: "sent",
        });
      } catch (err) {
        console.error("GT baseline email failed:", err);
        failed++;
        continue;
      }
    }
    sent++;
  }

  return NextResponse.json({
    ok: true,
    considered: byEmail.size,
    sent,
    skipped,
    failed,
  });
}
