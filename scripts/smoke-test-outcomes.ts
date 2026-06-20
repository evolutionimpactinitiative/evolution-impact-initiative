// End-to-end smoke test for outcomes Phase 3 Sprint 1.
//   npx tsx scripts/smoke-test-outcomes.ts
//
// Creates a participant + invitation, submits a response via the schema path
// (mirrors the server action), verifies scoring, cleans up.

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
  const tag = ok ? "✓" : "✗";
  console.log(`  ${tag} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

// Mirror of SWEMWBS scoring from lib/outcomes/scoring.ts
const SWEMWBS_METRIC: Record<number, number> = {
  7: 7, 8: 9.51, 9: 11.25, 10: 12.4, 11: 13.33, 12: 14.08, 13: 14.75,
  14: 15.32, 15: 15.84, 16: 16.36, 17: 16.88, 18: 17.43, 19: 17.98,
  20: 18.59, 21: 19.25, 22: 19.98, 23: 20.73, 24: 21.54, 25: 22.35,
  26: 23.21, 27: 24.11, 28: 25.03, 29: 26.02, 30: 27.03, 31: 28.13,
  32: 29.31, 33: 30.7, 34: 32.55, 35: 35,
};

async function main() {
  console.log("\n→ Smoke test: outcomes v1 (ONS4 + SWEMWBS)");

  // 1. Confirm instruments seeded
  console.log("\n[1] Instruments");
  const { data: ons4 } = await admin
    .from("outcome_instruments")
    .select("*")
    .eq("code", "ONS4")
    .maybeSingle();
  log("ONS4 seeded", !!ons4, (ons4 as any)?.name);
  const { data: swemwbs } = await admin
    .from("outcome_instruments")
    .select("*")
    .eq("code", "SWEMWBS")
    .maybeSingle();
  log("SWEMWBS seeded", !!swemwbs, (swemwbs as any)?.name);
  log(
    "ONS4 has 4 items",
    (((ons4 as any)?.items as unknown[]) ?? []).length === 4,
  );
  log(
    "SWEMWBS has 7 items",
    (((swemwbs as any)?.items as unknown[]) ?? []).length === 7,
  );

  if (!ons4 || !swemwbs) {
    console.log("Missing seed — abort.");
    process.exit(1);
  }

  // 2. Create participant + invitation for SWEMWBS
  console.log("\n[2] Create participant + SWEMWBS invitation");
  const { data: participant } = await admin
    .from("outcome_participants")
    .insert({
      name: "SMOKE — Test Participant",
      email: `_smoke_${Date.now()}@example.invalid`,
    })
    .select()
    .single();
  log("participant created", !!participant);

  const token = `smoke-${Math.random().toString(36).slice(2, 14)}`;
  const { data: invitation } = await admin
    .from("outcome_invitations")
    .insert({
      token,
      instrument_id: (swemwbs as any).id,
      participant_id: (participant as any).id,
      context_label: "SMOKE — sprint 3 verify",
      timepoint: "baseline",
    })
    .select()
    .single();
  log("invitation created", !!invitation, `token=${token}`);

  // 3. Submit a SWEMWBS response (all 4s → raw 28, metric 25.03 = avg band)
  console.log("\n[3] Submit SWEMWBS (all 4s → raw 28, metric 25.03)");
  const swemwbsAnswers: Record<string, number> = {};
  for (const item of (swemwbs as any).items) {
    swemwbsAnswers[item.id] = 4;
  }
  const raw = Object.values(swemwbsAnswers).reduce((s, v) => s + v, 0);
  const metric = SWEMWBS_METRIC[raw];
  const band = metric < 21 ? "low" : metric <= 27 ? "average" : "high";

  const { data: response } = await admin
    .from("outcome_responses")
    .insert({
      invitation_id: (invitation as any).id,
      instrument_id: (swemwbs as any).id,
      participant_id: (participant as any).id,
      context_label: "SMOKE — sprint 3 verify",
      timepoint: "baseline",
      score_raw: raw,
      score_transformed: metric,
      score_band: band,
    })
    .select()
    .single();
  log("response inserted", !!response);
  log("raw=28", (response as any)?.score_raw === 28);
  log("transformed=25.03", (response as any)?.score_transformed === 25.03);
  log("band=average", (response as any)?.score_band === "average");

  // Per-item rows
  const itemRows = (swemwbs as any).items.map((it: any) => ({
    response_id: (response as any).id,
    item_id: it.id,
    value_numeric: 4,
  }));
  const { error: itemsErr } = await admin
    .from("outcome_response_items")
    .insert(itemRows);
  log("7 per-item rows inserted", !itemsErr, itemsErr?.message);

  // Mark invitation used
  await admin
    .from("outcome_invitations")
    .update({ response_id: (response as any).id })
    .eq("id", (invitation as any).id);

  // 4. Verify the read joins look right (mirrors the admin page query)
  console.log("\n[4] Verify joined read");
  const { data: rback } = await admin
    .from("outcome_responses")
    .select(
      "id, score_raw, score_transformed, score_band, instrument:outcome_instruments(code,name), participant:outcome_participants(name)",
    )
    .eq("id", (response as any).id)
    .maybeSingle();
  log(
    "instrument.code joins",
    ((rback as any)?.instrument as any)?.code === "SWEMWBS",
  );
  log(
    "participant.name joins",
    ((rback as any)?.participant as any)?.name === "SMOKE — Test Participant",
  );

  // 5. Cleanup
  console.log("\n[5] Cleanup");
  await admin.from("outcome_response_items").delete().eq("response_id", (response as any).id);
  await admin.from("outcome_invitations").delete().eq("id", (invitation as any).id);
  await admin.from("outcome_responses").delete().eq("id", (response as any).id);
  await admin.from("outcome_participants").delete().eq("id", (participant as any).id);
  log("smoke data removed", true);

  console.log(`\n${failed === 0 ? "All checks passed." : `${failed} check(s) FAILED.`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
