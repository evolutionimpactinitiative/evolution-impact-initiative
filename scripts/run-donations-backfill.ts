// One-off: backfill completed donations into the accounting ledger.
// Re-runnable — idempotent via donations.accounting_transaction_id.
//
//   npx tsx scripts/run-donations-backfill.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Inline .env.local loader
try {
  const raw = readFileSync(resolve(".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
} catch {
  /* ignore */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// We can't import the server action directly here (Next.js "use server" wrappers
// expect the framework runtime), so we replicate the bridge inline.

function donationAmountPence(amount: number): number {
  return Math.round(amount * 100);
}

async function resolveCampaignTarget(
  campaign: string | null,
): Promise<{ fund_id: string; fund_category_id: string } | null> {
  const { data: mappings } = await admin
    .from("donation_campaign_mappings")
    .select("campaign_pattern, fund_code, fund_category_code")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const list = (mappings ?? []) as {
    campaign_pattern: string;
    fund_code: string;
    fund_category_code: string;
  }[];
  if (list.length === 0) return null;

  const value = campaign ?? "general";
  for (const m of list) {
    const pattern = m.campaign_pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/%/g, ".*")
      .replace(/_/g, ".");
    const re = new RegExp(`^${pattern}$`, "i");
    if (re.test(value)) {
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

async function postOne(donation_id: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: d } = await (admin as any)
    .from("donations")
    .select(
      "id, amount, campaign, status, completed_at, created_at, stripe_payment_intent_id, accounting_transaction_id",
    )
    .eq("id", donation_id)
    .maybeSingle();
  if (!d) return "not found";
  if (d.accounting_transaction_id) return null; // already linked
  if (d.status !== "completed") return `status=${d.status}`;
  const amount_pence = donationAmountPence(d.amount);
  if (amount_pence <= 0) return "zero amount";

  const target = await resolveCampaignTarget(d.campaign);
  if (!target) return `no mapping for "${d.campaign}"`;

  const { data: incomeAccount } = await admin
    .from("accounts")
    .select("id")
    .eq("code", "4000")
    .maybeSingle();
  const { data: stripeAccount } = await admin
    .from("accounts")
    .select("id")
    .eq("code", "1500")
    .maybeSingle();
  if (!incomeAccount || !stripeAccount) return "missing accounts 4000/1500";

  const date = (d.completed_at ?? d.created_at).slice(0, 10);
  const { data: period } = await admin
    .from("accounting_periods")
    .select("id")
    .lte("starts_on", date)
    .gte("ends_on", date)
    .maybeSingle();
  if (!period) return `no period for ${date}`;

  const reference = d.stripe_payment_intent_id ?? `donation:${d.id.slice(0, 8)}`;
  const description = `Donation${d.campaign ? ` (${d.campaign})` : ""}`;

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
  if (txErr || !tx) return txErr?.message ?? "tx insert failed";

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
    await admin.from("transactions").delete().eq("id", tx.id);
    return linesErr.message;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: postErr } = await (admin as any)
    .from("transactions")
    .update({ status: "posted", posted_at: new Date().toISOString() })
    .eq("id", tx.id);
  if (postErr) return postErr.message;

  await admin
    .from("donations")
    .update({ accounting_transaction_id: tx.id })
    .eq("id", d.id);
  return null;
}

async function main() {
  console.log("\n→ Donations backfill");
  const { data: rows } = await admin
    .from("donations")
    .select("id, amount, campaign")
    .eq("status", "completed")
    .is("accounting_transaction_id", null);
  const list = (rows ?? []) as { id: string; amount: number; campaign: string | null }[];
  console.log(`  Found ${list.length} unbridged completed donation(s)`);
  let posted = 0;
  const failures: { id: string; error: string }[] = [];
  for (const d of list) {
    const err = await postOne(d.id);
    if (err) {
      failures.push({ id: d.id, error: err });
      console.log(`  ✗ ${d.id.slice(0, 8)} (£${d.amount} / ${d.campaign}): ${err}`);
    } else {
      posted++;
      console.log(`  ✓ ${d.id.slice(0, 8)} (£${d.amount} / ${d.campaign}) posted`);
    }
  }
  console.log(`\n  Posted ${posted} · failed ${failures.length}\n`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
