"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// donations.amount is stored as POUNDS-as-integer (not pence, despite the
// schema comment). One place to convert if that ever changes.
function donationAmountPence(amount: number): number {
  return Math.round(amount * 100);
}

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface DonationRow {
  id: string;
  amount: number;
  campaign: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  stripe_payment_intent_id: string | null;
  accounting_transaction_id: string | null;
}

interface CampaignMapping {
  campaign_pattern: string;
  fund_code: string;
  fund_category_code: string;
}

// ----------------------------------------------------------------------------
// Resolve the right fund + category for a donation given its campaign string.
// Loops over donation_campaign_mappings in display_order, first ILIKE match wins.
// ----------------------------------------------------------------------------
async function resolveCampaignTarget(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  campaign: string | null,
): Promise<{ fund_id: string; fund_category_id: string } | null> {
  const { data: mappings } = await admin
    .from("donation_campaign_mappings")
    .select("campaign_pattern, fund_code, fund_category_code")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const list = (mappings ?? []) as CampaignMapping[];
  if (list.length === 0) return null;

  const value = campaign ?? "general"; // null campaign defaults to general bucket

  for (const m of list) {
    // Convert SQL LIKE pattern to JS regex for client-side matching
    // % → .*, _ → .  ; everything else is literal
    const pattern = m.campaign_pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/%/g, ".*")
      .replace(/_/g, ".");
    const re = new RegExp(`^${pattern}$`, "i");
    if (re.test(value)) {
      // Resolve fund_id + fund_category_id from the codes
      const { data: fund } = await admin
        .from("funds")
        .select("id")
        .eq("code", m.fund_code)
        .maybeSingle();
      if (!fund) continue;
      const { data: cat } = await admin
        .from("fund_categories")
        .select("id")
        .eq("fund_id", fund.id)
        .eq("code", m.fund_category_code)
        .maybeSingle();
      if (!cat) continue;
      return { fund_id: fund.id, fund_category_id: cat.id };
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// Post a single donation to the accounting ledger. Idempotent: re-running
// against an already-linked donation is a no-op success.
// ----------------------------------------------------------------------------
export async function postDonationToAccounting(
  donation_id: string,
): Promise<ActionResult<{ transaction_id: string | null; skipped: boolean; reason?: string }>> {
  try {
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: d } = await (admin as any)
      .from("donations")
      .select(
        "id, amount, campaign, status, completed_at, created_at, stripe_payment_intent_id, accounting_transaction_id",
      )
      .eq("id", donation_id)
      .maybeSingle();
    const donation = d as DonationRow | null;
    if (!donation) return { ok: false, error: "Donation not found" };

    if (donation.accounting_transaction_id) {
      return {
        ok: true,
        data: { transaction_id: donation.accounting_transaction_id, skipped: true, reason: "already linked" },
      };
    }
    if (donation.status !== "completed") {
      return {
        ok: true,
        data: { transaction_id: null, skipped: true, reason: `status=${donation.status}` },
      };
    }
    const amount_pence = donationAmountPence(donation.amount);
    if (amount_pence <= 0) {
      return { ok: true, data: { transaction_id: null, skipped: true, reason: "zero or negative amount" } };
    }

    const target = await resolveCampaignTarget(admin, donation.campaign);
    if (!target) {
      return { ok: false, error: `No campaign mapping resolved for "${donation.campaign}"` };
    }

    // Income (4000 Donations) credit; Stripe balance (1500) debit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: incomeAccount } = await (admin as any)
      .from("accounts")
      .select("id")
      .eq("code", "4000")
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stripeAccount } = await (admin as any)
      .from("accounts")
      .select("id")
      .eq("code", "1500")
      .maybeSingle();
    if (!incomeAccount || !stripeAccount) {
      return { ok: false, error: "Chart of accounts missing 4000 or 1500" };
    }

    const date = (donation.completed_at ?? donation.created_at).slice(0, 10);

    // Find period covering the donation date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: period } = await (admin as any)
      .from("accounting_periods")
      .select("id")
      .lte("starts_on", date)
      .gte("ends_on", date)
      .maybeSingle();
    if (!period) {
      return { ok: false, error: `No accounting period covers ${date}` };
    }

    const description = `Donation${donation.campaign ? ` (${donation.campaign})` : ""}`;
    const reference = donation.stripe_payment_intent_id ?? `donation:${donation.id.slice(0, 8)}`;

    // 1. Create draft tx
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tx, error: txErr } = await (admin as any)
      .from("transactions")
      .insert({
        transaction_date: date,
        period_id: period.id,
        reference,
        description,
        status: "draft",
      })
      .select()
      .single();
    if (txErr || !tx) return { ok: false, error: txErr?.message ?? "tx insert failed" };

    // 2. Balanced journal lines
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linesErr } = await (admin as any).from("journal_lines").insert([
      {
        transaction_id: tx.id,
        account_id: stripeAccount.id,
        fund_id: target.fund_id,
        fund_category_id: target.fund_category_id,
        debit_pence: amount_pence,
        credit_pence: 0,
        display_order: 1,
      },
      {
        transaction_id: tx.id,
        account_id: incomeAccount.id,
        fund_id: target.fund_id,
        fund_category_id: target.fund_category_id,
        debit_pence: 0,
        credit_pence: amount_pence,
        display_order: 2,
      },
    ]);
    if (linesErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("transactions").delete().eq("id", tx.id);
      return { ok: false, error: linesErr.message };
    }

    // 3. Post the tx
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: postErr } = await (admin as any)
      .from("transactions")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", tx.id);
    if (postErr) return { ok: false, error: postErr.message };

    // 4. Link the donation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("donations")
      .update({ accounting_transaction_id: tx.id })
      .eq("id", donation.id);

    revalidatePath("/admin/accounting");
    revalidatePath("/admin/accounting/transactions");
    revalidatePath("/admin/festival/donations");

    return { ok: true, data: { transaction_id: tx.id as string, skipped: false } };
  } catch (err) {
    console.error("[postDonationToAccounting]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}

// ----------------------------------------------------------------------------
// Backfill: post every completed-but-unlinked donation.
// ----------------------------------------------------------------------------
export async function backfillCompletedDonations(): Promise<
  ActionResult<{ processed: number; posted: number; failures: { donation_id: string; error: string }[] }>
> {
  try {
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (admin as any)
      .from("donations")
      .select("id")
      .eq("status", "completed")
      .is("accounting_transaction_id", null);
    const list = (rows ?? []) as { id: string }[];

    const failures: { donation_id: string; error: string }[] = [];
    let posted = 0;

    for (const r of list) {
      const result = await postDonationToAccounting(r.id);
      if (!result.ok) {
        failures.push({ donation_id: r.id, error: result.error });
      } else if (!result.data.skipped) {
        posted++;
      }
    }

    return { ok: true, data: { processed: list.length, posted, failures } };
  } catch (err) {
    console.error("[backfillCompletedDonations]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unexpected error" };
  }
}
