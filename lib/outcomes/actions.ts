"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { scoreResponse } from "./scoring";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { outcomeInvitationEmail } from "@/lib/email/templates";
import type { OutcomeInstrument, OutcomeInvitation, OutcomeParticipant, Timepoint } from "./types";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// URL-safe token generator. 16 chars from a 36-char alphabet = ~82 bits entropy.
// Strong enough that guessing is impractical even at scale.
// ---------------------------------------------------------------------------
function generateInvitationToken(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

async function getCurrentTeamMemberId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Submit a completed outcome response. Anonymous-friendly: the caller may
// optionally provide their name/email which lazy-creates a participant row.
// ---------------------------------------------------------------------------
export interface SubmitOutcomeInput {
  token: string;
  answers: Record<string, number>; // item_id → numeric value
  // optional self-identification (filled in by the participant on the form)
  participant_name?: string;
  participant_email?: string;
}

export async function submitOutcomeResponse(
  input: SubmitOutcomeInput,
): Promise<ActionResult<{ response_id: string; score_band: string | null }>> {
  try {
    const admin = createAdminClient();

    // 1. Resolve invitation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invRaw } = await (admin as any)
      .from("outcome_invitations")
      .select("*")
      .eq("token", input.token)
      .maybeSingle();
    const invitation = invRaw as OutcomeInvitation | null;
    if (!invitation) return { ok: false, error: "Invalid or expired link" };
    if (invitation.response_id) {
      return { ok: false, error: "This survey has already been submitted" };
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return { ok: false, error: "This survey link has expired" };
    }

    // 2. Load instrument
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: instRaw } = await (admin as any)
      .from("outcome_instruments")
      .select("*")
      .eq("id", invitation.instrument_id)
      .maybeSingle();
    const instrument = instRaw as OutcomeInstrument | null;
    if (!instrument) return { ok: false, error: "Instrument not found" };

    // 3. Validate answers — every item must have a numeric value
    for (const item of instrument.items) {
      if (input.answers[item.id] == null) {
        return { ok: false, error: `Missing answer: ${item.text}` };
      }
    }

    // 4. Resolve participant — use invitation's if set, otherwise lazy-create
    let participantId = invitation.participant_id;
    if (!participantId && (input.participant_email || input.participant_name)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (admin as any)
        .from("outcome_participants")
        .select("id")
        .ilike("email", input.participant_email ?? "")
        .maybeSingle();
      if (existing?.id) {
        participantId = existing.id;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created } = await (admin as any)
          .from("outcome_participants")
          .insert({
            email: input.participant_email ?? null,
            name: input.participant_name ?? null,
          })
          .select("id")
          .single();
        const p = created as Pick<OutcomeParticipant, "id"> | null;
        participantId = p?.id ?? null;
      }
    }

    // 5. Score
    const score = scoreResponse(instrument.items, instrument.scoring, input.answers);

    // 6. Insert response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: response, error: respErr } = await (admin as any)
      .from("outcome_responses")
      .insert({
        invitation_id: invitation.id,
        instrument_id: instrument.id,
        participant_id: participantId,
        context_label: invitation.context_label,
        programme_strand: invitation.programme_strand,
        timepoint: invitation.timepoint,
        score_raw: score.raw,
        score_transformed: score.transformed,
        score_band: score.band,
      })
      .select()
      .single();
    if (respErr || !response) {
      return { ok: false, error: respErr?.message ?? "Failed to record response" };
    }

    // 7. Per-item rows
    const itemRows = instrument.items.map((it) => ({
      response_id: response.id,
      item_id: it.id,
      value_numeric: input.answers[it.id],
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("outcome_response_items").insert(itemRows);

    // 8. Mark invitation as used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("outcome_invitations")
      .update({ response_id: response.id })
      .eq("id", invitation.id);

    revalidatePath("/admin/outcomes");
    return {
      ok: true,
      data: { response_id: response.id as string, score_band: score.band },
    };
  } catch (err) {
    console.error("[submitOutcomeResponse]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

// ---------------------------------------------------------------------------
// Create an invitation (admin). Generates a token, optionally lazy-creates
// the participant, optionally fires the invitation email via Resend.
// ---------------------------------------------------------------------------
export interface CreateInvitationInput {
  instrument_id: string;
  timepoint: Timepoint;
  // Either an existing participant id, OR fields to lazy-create one
  participant_id?: string;
  new_participant_name?: string;
  new_participant_email?: string;
  // Optional metadata
  context_label?: string;
  programme_strand?: string;
  // If true, send the invitation email after creating
  send_email: boolean;
  recipient_email?: string;
  // Expiry in days from now (default 90)
  expires_in_days?: number;
}

export async function createOutcomeInvitation(
  input: CreateInvitationInput,
): Promise<ActionResult<{ invitation_id: string; token: string; url: string; emailed: boolean }>> {
  try {
    const me_id = await getCurrentTeamMemberId();
    const admin = createAdminClient();

    // 1. Resolve instrument
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inst } = await (admin as any)
      .from("outcome_instruments")
      .select("id, name, is_active")
      .eq("id", input.instrument_id)
      .maybeSingle();
    if (!inst || !inst.is_active) {
      return { ok: false, error: "Instrument not found or inactive" };
    }

    // 2. Resolve / create participant
    let participantId: string | null = input.participant_id ?? null;
    let participantName: string | null = null;
    let participantEmail: string | null = null;

    if (participantId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: p } = await (admin as any)
        .from("outcome_participants")
        .select("id, name, email")
        .eq("id", participantId)
        .maybeSingle();
      if (!p) return { ok: false, error: "Participant not found" };
      participantName = p.name;
      participantEmail = p.email;
    } else if (input.new_participant_email || input.new_participant_name) {
      // Reuse existing row if email matches
      if (input.new_participant_email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (admin as any)
          .from("outcome_participants")
          .select("id, name, email")
          .ilike("email", input.new_participant_email)
          .maybeSingle();
        if (existing?.id) {
          participantId = existing.id;
          participantName = existing.name;
          participantEmail = existing.email;
        }
      }
      if (!participantId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created } = await (admin as any)
          .from("outcome_participants")
          .insert({
            name: input.new_participant_name ?? null,
            email: input.new_participant_email ?? null,
          })
          .select()
          .single();
        if (!created) return { ok: false, error: "Failed to create participant" };
        participantId = created.id;
        participantName = created.name;
        participantEmail = created.email;
      }
    }

    // 3. Compute recipient + expiry + token
    const recipient_email =
      input.recipient_email?.trim() || participantEmail || null;
    if (input.send_email && !recipient_email) {
      return { ok: false, error: "Cannot send email: no recipient address" };
    }

    const expiresInDays = input.expires_in_days ?? 90;
    const expires_at = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const token = generateInvitationToken();

    // 4. Insert the invitation row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation, error: invErr } = await (admin as any)
      .from("outcome_invitations")
      .insert({
        token,
        instrument_id: input.instrument_id,
        participant_id: participantId,
        timepoint: input.timepoint,
        context_label: input.context_label?.trim() || null,
        programme_strand: input.programme_strand?.trim() || null,
        recipient_email,
        expires_at,
        created_by: me_id,
      })
      .select()
      .single();
    if (invErr || !invitation) {
      return { ok: false, error: invErr?.message ?? "Failed to create invitation" };
    }

    // 5. Build the URL
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
    const url = `${base}/outcomes/${token}`;

    // 6. Send the email (optional)
    let emailed = false;
    if (input.send_email && recipient_email) {
      const resend = getResendClient();
      if (!resend) {
        console.warn("[createOutcomeInvitation] RESEND_API_KEY not set — invitation saved but not emailed");
      } else {
        const { subject, html } = outcomeInvitationEmail(
          participantName,
          inst.name,
          url,
          input.context_label ?? null,
          input.timepoint,
        );
        const { error: sendErr } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient_email,
          replyTo: REPLY_TO_EMAIL,
          subject,
          html,
        });
        if (sendErr) {
          console.error("[createOutcomeInvitation] email send error", sendErr);
        } else {
          emailed = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from("outcome_invitations")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("id", invitation.id);
        }
      }
    }

    revalidatePath("/admin/outcomes");
    revalidatePath("/admin/outcomes/invitations");
    return {
      ok: true,
      data: { invitation_id: invitation.id, token, url, emailed },
    };
  } catch (err) {
    console.error("[createOutcomeInvitation]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

// ---------------------------------------------------------------------------
// Resend an existing invitation's email (rate-limited by display, not server)
// ---------------------------------------------------------------------------
export async function resendInvitationEmail(
  invitation_id: string,
): Promise<ActionResult<{ emailed: boolean }>> {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inv } = await (admin as any)
      .from("outcome_invitations")
      .select(
        `id, token, recipient_email, context_label, timepoint, response_id, expires_at,
         instrument:outcome_instruments ( name ),
         participant:outcome_participants ( name )`,
      )
      .eq("id", invitation_id)
      .maybeSingle();
    if (!inv) return { ok: false, error: "Invitation not found" };
    if (inv.response_id) return { ok: false, error: "Already submitted" };
    if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
      return { ok: false, error: "Invitation has expired" };
    }
    if (!inv.recipient_email) return { ok: false, error: "No recipient on this invitation" };

    const resend = getResendClient();
    if (!resend) return { ok: false, error: "Resend not configured" };

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
    const url = `${base}/outcomes/${inv.token}`;

    const { subject, html } = outcomeInvitationEmail(
      inv.participant?.name ?? null,
      inv.instrument?.name ?? "wellbeing survey",
      url,
      inv.context_label ?? null,
      inv.timepoint as Timepoint,
    );
    const { error: sendErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: inv.recipient_email,
      replyTo: REPLY_TO_EMAIL,
      subject,
      html,
    });
    if (sendErr) return { ok: false, error: sendErr.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("outcome_invitations")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", invitation_id);
    revalidatePath("/admin/outcomes/invitations");
    return { ok: true, data: { emailed: true } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}
