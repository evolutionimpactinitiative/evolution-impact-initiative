"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreResponse } from "./scoring";
import type { OutcomeInstrument, OutcomeInvitation, OutcomeParticipant } from "./types";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
