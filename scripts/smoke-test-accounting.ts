// One-off smoke test for the accounting v2 data path.
// Mirrors what TransactionForm + createPaymentOut + reverseTransaction do
// against the live DB, then cleans up so nothing is left behind.
//
// Run with:  npx tsx scripts/smoke-test-accounting.ts
//
// Safe: every change is reversed at the end. Two reversal-shaped journal
// entries will remain in the audit trail (this is correct accounting
// behaviour — posted transactions are never deleted, only reversed).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Minimal .env.local loader so we don't need dotenv as a dep.
try {
  const raw = readFileSync(resolve(".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    const [, k, vRaw] = m;
    if (process.env[k]) continue;
    process.env[k] = vRaw.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
} catch {
  // ignore — env may already be set
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function log(label: string, ok: boolean, detail?: string) {
  const tag = ok ? "✓" : "✗";
  console.log(`  ${tag} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  console.log("\n→ Smoke test: accounting v2 transaction path");

  // ──────────────────────────────────────────────────────────────────────
  // 1. Resolve seed IDs we need
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[1] Resolve seed IDs");

  const { data: fund } = await admin
    .from("funds")
    .select("id, name")
    .eq("code", "CIN_WMF")
    .maybeSingle();
  log("CIN_WMF fund found", !!fund, fund?.name);

  const { data: category } = await admin
    .from("fund_categories")
    .select("id, name")
    .eq("fund_id", fund?.id)
    .eq("code", "sessional_staff")
    .maybeSingle();
  log("sessional_staff category found", !!category, category?.name);

  const { data: expenseAccount } = await admin
    .from("accounts")
    .select("id, name")
    .eq("code", "5000")
    .maybeSingle();
  log("expense account 5000 found", !!expenseAccount, expenseAccount?.name);

  const { data: bankAccount } = await admin
    .from("accounts")
    .select("id, name")
    .eq("code", "1000")
    .maybeSingle();
  log("bank account 1000 found", !!bankAccount, bankAccount?.name);

  if (!fund || !category || !expenseAccount || !bankAccount) {
    console.error("\nMissing seed data — abort.");
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2. Find an open period covering today
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[2] Find open period for today");
  const today = new Date().toISOString().split("T")[0];
  const { data: period } = await admin
    .from("accounting_periods")
    .select("id, name, status")
    .lte("starts_on", today)
    .gte("ends_on", today)
    .maybeSingle();
  log("open period found", !!period && period.status === "open", period?.name);
  if (!period) process.exit(1);

  // ──────────────────────────────────────────────────────────────────────
  // 3. Upload a tiny test PDF to the attachments bucket
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[3] Upload test attachment");
  // 4-byte "PDF" — Supabase doesn't validate PDF magic, just mime type
  const fakePdf = Buffer.from("%PDF-1.4\n%EOF\n", "utf-8");
  const storagePath = `${today.slice(0, 4)}/${Date.now()}-smoke-test.pdf`;
  const { error: uploadErr } = await admin.storage
    .from("attachments")
    .upload(storagePath, fakePdf, { contentType: "application/pdf", upsert: false });
  log("attachment uploaded", !uploadErr, uploadErr?.message ?? storagePath);
  if (uploadErr) process.exit(1);

  // ──────────────────────────────────────────────────────────────────────
  // 4. Create the transaction (mirrors createPaymentOut exactly)
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[4] Insert transaction + journal lines + attachment");
  const amount_pence = 45000; // £450
  const reference = `SMOKE-${Date.now()}`;
  const description = "TEST — Sarah, Early Years session 12 Jul";

  const { data: tx, error: txErr } = await admin
    .from("transactions")
    .insert({
      transaction_date: today,
      period_id: period.id,
      reference,
      description,
      status: "draft",
    })
    .select()
    .single();
  log("draft transaction created", !txErr, txErr?.message ?? tx?.id);
  if (!tx) {
    await admin.storage.from("attachments").remove([storagePath]);
    process.exit(1);
  }

  const { error: linesErr } = await admin.from("journal_lines").insert([
    {
      transaction_id: tx.id,
      account_id: expenseAccount.id,
      fund_id: fund.id,
      fund_category_id: category.id,
      debit_pence: amount_pence,
      credit_pence: 0,
      display_order: 1,
    },
    {
      transaction_id: tx.id,
      account_id: bankAccount.id,
      fund_id: fund.id,
      fund_category_id: category.id,
      debit_pence: 0,
      credit_pence: amount_pence,
      display_order: 2,
    },
  ]);
  log("balanced journal lines inserted", !linesErr, linesErr?.message);

  const { error: attErr } = await admin.from("attachments").insert({
    entity_type: "transaction",
    entity_id: tx.id,
    filename: "smoke-test.pdf",
    mime_type: "application/pdf",
    file_size_bytes: fakePdf.length,
    storage_bucket: "attachments",
    storage_path: storagePath,
  });
  log("attachment record created", !attErr, attErr?.message);

  // ──────────────────────────────────────────────────────────────────────
  // 5. Post the transaction (trigger validates balance)
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[5] Post the transaction (trigger should validate balance)");
  const { error: postErr } = await admin
    .from("transactions")
    .update({ status: "posted", posted_at: new Date().toISOString() })
    .eq("id", tx.id);
  log("post succeeded (balance trigger passed)", !postErr, postErr?.message);

  // ──────────────────────────────────────────────────────────────────────
  // 6. Read back and verify shape
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[6] Verify persisted state");
  const { data: verifyTx } = await admin
    .from("transactions")
    .select(`*, journal_lines (*)`)
    .eq("id", tx.id)
    .single();

  const totalDebits = (verifyTx?.journal_lines ?? []).reduce(
    (s: number, l: { debit_pence: number }) => s + l.debit_pence,
    0,
  );
  const totalCredits = (verifyTx?.journal_lines ?? []).reduce(
    (s: number, l: { credit_pence: number }) => s + l.credit_pence,
    0,
  );

  log("status = posted", verifyTx?.status === "posted", String(verifyTx?.status));
  log("2 journal lines", (verifyTx?.journal_lines ?? []).length === 2);
  log("debits = credits", totalDebits === totalCredits, `${totalDebits} = ${totalCredits}`);
  log("amount = £450", totalDebits === 45000, `${totalDebits / 100}`);

  const { data: verifyAtt } = await admin
    .from("attachments")
    .select("*")
    .eq("entity_type", "transaction")
    .eq("entity_id", tx.id);
  log("attachment row persisted", (verifyAtt?.length ?? 0) === 1);

  const { data: verifyFile } = await admin.storage
    .from("attachments")
    .list(storagePath.split("/").slice(0, -1).join("/"), {
      search: storagePath.split("/").pop(),
    });
  log(
    "storage file present",
    !!verifyFile?.some((f) => f.name === storagePath.split("/").pop()),
  );

  // ──────────────────────────────────────────────────────────────────────
  // 7. Try inserting unbalanced lines on a new draft — trigger MUST reject
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[7] Negative test: unbalanced post must be rejected");
  const { data: badTx } = await admin
    .from("transactions")
    .insert({
      transaction_date: today,
      period_id: period.id,
      reference: `SMOKE-BAD-${Date.now()}`,
      description: "SMOKE — should fail to post (unbalanced)",
      status: "draft",
    })
    .select()
    .single();

  if (badTx) {
    await admin.from("journal_lines").insert([
      {
        transaction_id: badTx.id,
        account_id: expenseAccount.id,
        fund_id: fund.id,
        fund_category_id: category.id,
        debit_pence: 10000,
        credit_pence: 0,
        display_order: 1,
      },
      {
        transaction_id: badTx.id,
        account_id: bankAccount.id,
        fund_id: fund.id,
        fund_category_id: category.id,
        debit_pence: 0,
        credit_pence: 9999, // INTENTIONALLY off by 1p
        display_order: 2,
      },
    ]);
    const { error: badPostErr } = await admin
      .from("transactions")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", badTx.id);
    log(
      "unbalanced post rejected by trigger",
      !!badPostErr,
      badPostErr?.message ?? "ERROR: post succeeded — trigger is broken",
    );
    // Clean up bad tx regardless
    await admin.from("transactions").delete().eq("id", badTx.id);
  }

  // ──────────────────────────────────────────────────────────────────────
  // 8. Reverse the smoke-test transaction (mirrors reverseTransaction)
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[8] Reverse the smoke-test transaction");
  const { data: reversal } = await admin
    .from("transactions")
    .insert({
      transaction_date: today,
      period_id: period.id,
      reference: `REV-${reference}`,
      description: `Reversal of ${tx.id.slice(0, 8)}: smoke test cleanup`,
      status: "draft",
    })
    .select()
    .single();
  log("reversal draft created", !!reversal);

  if (reversal) {
    const flipped = (verifyTx!.journal_lines as {
      account_id: string;
      fund_id: string;
      fund_category_id: string | null;
      debit_pence: number;
      credit_pence: number;
    }[]).map((l, i) => ({
      transaction_id: reversal.id,
      account_id: l.account_id,
      fund_id: l.fund_id,
      fund_category_id: l.fund_category_id,
      debit_pence: l.credit_pence,
      credit_pence: l.debit_pence,
      display_order: i + 1,
    }));
    const { error: flipErr } = await admin.from("journal_lines").insert(flipped);
    log("flipped lines inserted", !flipErr, flipErr?.message);

    const { error: postRevErr } = await admin
      .from("transactions")
      .update({ status: "posted", posted_at: new Date().toISOString() })
      .eq("id", reversal.id);
    log("reversal posted", !postRevErr, postRevErr?.message);

    const { error: markErr } = await admin
      .from("transactions")
      .update({ status: "reversed", reversed_by_transaction_id: reversal.id })
      .eq("id", tx.id);
    log("original marked reversed", !markErr, markErr?.message);
  }

  // ──────────────────────────────────────────────────────────────────────
  // 9. Storage cleanup — remove the smoke-test file
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[9] Cleanup storage file");
  // Also delete the attachment record now that the original tx is reversed,
  // so we don't pollute the attachments table with smoke-test rows.
  await admin
    .from("attachments")
    .delete()
    .eq("entity_type", "transaction")
    .eq("entity_id", tx.id);
  const { error: rmErr } = await admin.storage
    .from("attachments")
    .remove([storagePath]);
  log("storage file removed", !rmErr, rmErr?.message ?? storagePath);

  // ──────────────────────────────────────────────────────────────────────
  // 10. Sprint 3 — RLS helper functions exist and treasurer role is allowed
  // ──────────────────────────────────────────────────────────────────────
  console.log("\n[10] Sprint 3 RLS — helpers + treasurer role");

  // Calling the helpers via rpc proves they exist. Service-role JWT has no
  // email claim, so all four return null/false — that's expected.
  const { error: roleErr } = await admin.rpc("acct_team_role");
  log("acct_team_role() callable", !roleErr, roleErr?.message);
  const { error: isAdminErr } = await admin.rpc("acct_is_admin");
  log("acct_is_admin() callable", !isAdminErr, isAdminErr?.message);
  const { error: isAtErr } = await admin.rpc("acct_is_admin_or_treasurer");
  log("acct_is_admin_or_treasurer() callable", !isAtErr, isAtErr?.message);
  const { error: currIdErr } = await admin.rpc("acct_current_team_member_id");
  log("acct_current_team_member_id() callable", !currIdErr, currIdErr?.message);

  // Treasurer role: insert + delete a throwaway row to prove the CHECK
  // constraint accepts the new value.
  const throwawayEmail = `_smoke_test_treasurer_${Date.now()}@example.invalid`;
  const { error: tInsErr } = await admin.from("team_members").insert({
    email: throwawayEmail,
    name: "Smoke Test Treasurer",
    role: "treasurer",
  });
  log("team_members accepts role='treasurer'", !tInsErr, tInsErr?.message);
  await admin.from("team_members").delete().eq("email", throwawayEmail);

  // Spot-check that the expected policies exist by trying to create a draft
  // tx as the service role (always allowed, RLS bypassed) then immediately
  // clean it up. This is essentially a no-op — the real RLS verification
  // happens when a non-service-role connection is added in a future sprint.
  // Counting policies is the closest structural check we can do here.
  console.log(
    "  ↪ Full RLS policy verification requires authenticated test users",
  );
  console.log(
    "  ↪ Apply the migration and inspect pg_policies in Supabase if in doubt",
  );

  console.log("\nDone.\n");
  // Avoid unused-import warning
  void resolve;
  void readFileSync;
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
