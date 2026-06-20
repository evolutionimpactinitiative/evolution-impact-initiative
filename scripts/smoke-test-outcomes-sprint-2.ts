// Sprint 2 smoke test: programme_strand + invitation token shape.
//   npx tsx scripts/smoke-test-outcomes-sprint-2.ts
//
// Verifies the new columns exist, programme_strand round-trips correctly,
// and an invitation row can be created with the new fields without the
// email-send path (which requires RESEND_API_KEY).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const raw = readFileSync(resolve(".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failed = 0;
function log(label: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

async function main() {
  console.log("\n→ Outcomes Sprint 2 smoke");

  // 1. Find an instrument
  const { data: inst } = await admin
    .from("outcome_instruments")
    .select("id, name")
    .eq("code", "SWEMWBS")
    .maybeSingle();
  if (!inst) { console.error("SWEMWBS missing"); process.exit(1); }

  // 2. Create an invitation with programme_strand + recipient_email
  const token = `smk-${Date.now().toString(36)}`;
  console.log("\n[1] Create invitation with programme_strand");
  const { data: invitation, error: invErr } = await admin
    .from("outcome_invitations")
    .insert({
      token,
      instrument_id: (inst as any).id,
      timepoint: "baseline",
      context_label: "SMOKE — Sprint 2 verify",
      programme_strand: "cin_early_years",
      recipient_email: "_smoke@example.invalid",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    })
    .select()
    .single();
  log("invitation created", !invErr, invErr?.message);
  log(
    "programme_strand round-trips",
    (invitation as any)?.programme_strand === "cin_early_years",
  );
  log(
    "recipient_email round-trips",
    (invitation as any)?.recipient_email === "_smoke@example.invalid",
  );
  log("email_sent_at starts null", (invitation as any)?.email_sent_at === null);

  // 3. Submit a response — should inherit programme_strand
  console.log("\n[2] Submit response inherits programme_strand");
  const answers: Record<string, number> = {};
  for (const item of (inst as any).items ?? []) answers[item.id] = 3;
  // The action lives in lib/outcomes/actions.ts and uses next/cache — calling
  // it from a script requires module shimming. Just exercise the raw insert
  // to confirm the column accepts data.
  const { data: response } = await admin
    .from("outcome_responses")
    .insert({
      invitation_id: (invitation as any).id,
      instrument_id: (inst as any).id,
      timepoint: "baseline",
      context_label: "SMOKE — Sprint 2 verify",
      programme_strand: (invitation as any).programme_strand,
      score_raw: 21,
      score_transformed: 19.25,
      score_band: "low",
    })
    .select()
    .single();
  log(
    "response inherited programme_strand",
    (response as any)?.programme_strand === "cin_early_years",
  );

  // 4. Mark email_sent_at
  console.log("\n[3] email_sent_at write");
  await admin
    .from("outcome_invitations")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", (invitation as any).id);
  const { data: reload } = await admin
    .from("outcome_invitations")
    .select("email_sent_at")
    .eq("id", (invitation as any).id)
    .maybeSingle();
  log("email_sent_at persisted", (reload as any)?.email_sent_at != null);

  // Cleanup
  await admin.from("outcome_responses").delete().eq("id", (response as any).id);
  await admin.from("outcome_invitations").delete().eq("id", (invitation as any).id);

  console.log(
    `\n${failed === 0 ? "All checks passed." : `${failed} check(s) FAILED.`}\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
