"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import { sponsorConfirmedEmail } from "@/lib/email/festival-templates";
import type { FestivalSponsor } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getReviewerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (member as any)?.id ?? null;
}

export async function confirmSponsor(sponsorId: string): Promise<ActionResult> {
  const reviewerId = await getReviewerId();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (admin as any)
    .from("festival_sponsors")
    .update({
      status: "confirmed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", sponsorId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { ok: false, error: updateErr?.message ?? "Sponsor not found" };
  }

  try {
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = sponsorConfirmedEmail({
        sponsor: updated as FestivalSponsor,
      });
      await resend.emails.send({
        from: FROM_EMAIL,
        to: updated.email,
        replyTo: REPLY_TO_EMAIL,
        subject,
        html,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("email_logs").insert({
        email_type: "sponsor_confirmed",
        recipient_email: updated.email,
        subject,
        sent_at: new Date().toISOString(),
        status: "sent",
      });
    }
  } catch (err) {
    console.error("[confirmSponsor] email error:", err);
  }

  revalidatePath("/admin/festival/sponsors");
  revalidatePath("/evolution-fest-2026"); // refresh public logo wall
  return { ok: true };
}

export async function cancelSponsor(
  sponsorId: string,
  note?: string,
): Promise<ActionResult> {
  const reviewerId = await getReviewerId();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("festival_sponsors")
    .select("*")
    .eq("id", sponsorId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Sponsor not found" };
  const sponsor = existing as FestivalSponsor;

  const wasPaid =
    sponsor.amount_pledged > 0 &&
    !!sponsor.stripe_payment_intent_id &&
    !sponsor.refunded_at;

  let refunded = false;
  let refundError: string | null = null;

  if (wasPaid) {
    try {
      const stripe = getStripeClient();
      if (stripe && sponsor.stripe_payment_intent_id) {
        await stripe.refunds.create({
          payment_intent: sponsor.stripe_payment_intent_id,
          reason: "requested_by_customer",
        });
        refunded = true;
      } else {
        refundError = "Stripe not configured — refund manually in Stripe.";
      }
    } catch (err) {
      refundError = err instanceof Error ? err.message : "Refund failed";
      console.error("[cancelSponsor] refund error:", err);
    }
  }

  const newStatus = refunded ? "refunded" : "cancelled";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from("festival_sponsors")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      refunded_at: refunded ? new Date().toISOString() : sponsor.refunded_at,
      admin_notes: note
        ? [sponsor.admin_notes, note].filter(Boolean).join("\n---\n")
        : sponsor.admin_notes,
    })
    .eq("id", sponsorId);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  revalidatePath("/admin/festival/sponsors");
  revalidatePath("/evolution-fest-2026");

  if (refundError) {
    return { ok: false, error: `Sponsor cancelled, but: ${refundError}` };
  }
  return { ok: true };
}
