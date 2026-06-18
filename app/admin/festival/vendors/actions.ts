"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getResendClient, FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/email/resend";
import {
  vendorApprovedEmail,
  vendorRejectedEmail,
} from "@/lib/email/festival-templates";
import type { FestivalVendor } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getReviewerId(): Promise<string | null> {
  // Resolve the current admin's team_members.id (for audit trail)
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

export async function approveVendor(vendorId: string): Promise<ActionResult> {
  const reviewerId = await getReviewerId();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (admin as any)
    .from("festival_vendors")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", vendorId)
    .select()
    .single();

  if (updateErr || !updated) {
    return { ok: false, error: updateErr?.message ?? "Vendor not found" };
  }

  // Send approval email
  try {
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = vendorApprovedEmail({
        vendor: updated as FestivalVendor,
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
        email_type: "vendor_approved",
        recipient_email: updated.email,
        subject,
        sent_at: new Date().toISOString(),
        status: "sent",
      });
    }
  } catch (err) {
    console.error("[approveVendor] email error:", err);
  }

  revalidatePath("/admin/festival/vendors");
  return { ok: true };
}

export async function rejectVendor(
  vendorId: string,
  reasonNote?: string,
): Promise<ActionResult> {
  const reviewerId = await getReviewerId();
  const admin = createAdminClient();

  // Load the current row to decide whether a refund is needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("festival_vendors")
    .select("*")
    .eq("id", vendorId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Vendor not found" };
  }
  const vendor = existing as FestivalVendor;
  const wasPaid =
    vendor.contribution_amount > 0 &&
    !!vendor.stripe_payment_intent_id &&
    !vendor.refunded_at;

  let refunded = false;
  let refundError: string | null = null;

  if (wasPaid) {
    try {
      const stripe = getStripeClient();
      if (stripe && vendor.stripe_payment_intent_id) {
        await stripe.refunds.create({
          payment_intent: vendor.stripe_payment_intent_id,
          reason: "requested_by_customer",
        });
        refunded = true;
      } else {
        refundError =
          "Stripe not configured — please refund manually in Stripe.";
      }
    } catch (err) {
      refundError = err instanceof Error ? err.message : "Refund failed";
      console.error("[rejectVendor] refund error:", err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateErr } = await (admin as any)
    .from("festival_vendors")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      refunded_at: refunded ? new Date().toISOString() : vendor.refunded_at,
      admin_notes: reasonNote
        ? [vendor.admin_notes, reasonNote].filter(Boolean).join("\n---\n")
        : vendor.admin_notes,
    })
    .eq("id", vendorId)
    .select()
    .single();

  if (updateErr || !updated) {
    return {
      ok: false,
      error: updateErr?.message ?? "Failed to update vendor",
    };
  }

  // Send rejection email
  try {
    const resend = getResendClient();
    if (resend) {
      const { subject, html } = vendorRejectedEmail({
        vendor: updated as FestivalVendor,
        reasonNote,
        refunded,
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
        email_type: "vendor_rejected",
        recipient_email: updated.email,
        subject,
        sent_at: new Date().toISOString(),
        status: "sent",
      });
    }
  } catch (err) {
    console.error("[rejectVendor] email error:", err);
  }

  revalidatePath("/admin/festival/vendors");

  if (refundError) {
    return { ok: false, error: `Vendor rejected, but: ${refundError}` };
  }
  return { ok: true };
}
