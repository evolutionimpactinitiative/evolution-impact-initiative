// Slice 5 baseline + feedback cron smoke test.
//   npx tsx scripts/smoke-slice-5.ts
//
// Requires dev server on localhost:3000. Seeds a GT event backdated to
// 3 days ago, a parent + child, a registration that is already marked
// attended, then hits both crons and asserts the DB side-effects.

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

const SITE = process.env.SITE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failed = 0;
const pass = (msg: string) => console.log(`  ✓ ${msg}`);
const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    failed++;
  } else pass(msg);
};
function fail(msg: string): never {
  console.error(`  ✗ ${msg}`);
  process.exit(1);
}

async function main() {
  const slug = `slice5-smoketest-${Date.now()}`;
  const email = `slice5-parent-${Date.now()}@example.com`;

  // Backdated event (3 days ago)
  const past = new Date();
  past.setDate(past.getDate() - 3);
  const { data: event } = await admin
    .from("events")
    .insert({
      slug,
      title: "Slice 5 Baseline Session",
      short_description: "Ephemeral baseline test session.",
      category: "family",
      event_type: "children",
      date: past.toISOString().slice(0, 10),
      start_time: "10:00",
      end_time: "12:00",
      venue_name: "Test Venue",
      venue_address: "86 King Street, Rochester, Kent, ME1 1YD",
      total_slots: 10,
      waitlist_slots: 5,
      max_children_per_registration: 4,
      status: "published",
      programme: "growing_together",
      primary_difference: "confidence",
      cycle_number: 1,
    })
    .select("id")
    .single();
  if (!event) fail("event seed failed");
  const eventId = event.id;

  // Family + carer + child (direct writes — auth flow isn't the target here)
  const { data: family } = await admin
    .from("families")
    .insert({ postcode: "ME1 1YD", preferred_contact_method: "email" })
    .select("id")
    .single();
  if (!family) fail("family seed failed");
  const familyId = family.id;

  const { data: carer } = await admin
    .from("parent_carers")
    .insert({
      family_id: familyId,
      user_id: null, // no auth user needed for cron test
      name: "Slice5 Parent",
      email,
      is_primary: true,
    })
    .select("id")
    .single();
  if (!carer) fail("carer seed failed");

  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - 3);
  const { data: child } = await admin
    .from("children")
    .insert({
      family_id: familyId,
      first_name: "Amara",
      date_of_birth: dob.toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  // Registration — already attended
  const { data: reg } = await admin
    .from("registrations")
    .insert({
      event_id: eventId,
      parent_name: "Slice5 Parent",
      parent_email: email,
      parent_phone: "07000000000",
      status: "confirmed",
      attended: "yes",
      family_id: familyId,
      registered_by_parent_carer_id: carer.id,
    })
    .select("id")
    .single();
  if (!reg) fail("registration seed failed");
  const regId = reg.id;

  await admin.from("registration_children").insert({
    registration_id: regId,
    child_id: child!.id,
    child_name: "Amara",
    child_age: 3,
    display_order: 0,
  });

  pass(`seeded event=${eventId.slice(0, 8)} reg=${regId.slice(0, 8)}`);

  // ==== HIT feedback cron ====
  console.log("\n  TEST: /api/cron/growing-together-feedback");
  const feedbackRes = await fetch(`${SITE}/api/cron/growing-together-feedback`);
  const feedbackBody = await feedbackRes.json();
  console.log("    →", feedbackRes.status, JSON.stringify(feedbackBody));
  assert(feedbackRes.status === 200 && feedbackBody.ok, "feedback cron returned ok");
  assert(feedbackBody.sent >= 1, `feedback cron sent ≥1 (${feedbackBody.sent})`);

  const { data: regAfter } = await admin
    .from("registrations")
    .select("feedback_email_sent_at")
    .eq("id", regId)
    .single();
  assert(!!regAfter?.feedback_email_sent_at, "registrations.feedback_email_sent_at populated");

  // Idempotency — running again should not re-send
  const feedback2 = await (await fetch(`${SITE}/api/cron/growing-together-feedback`)).json();
  assert(feedback2.sent === 0, `feedback cron is idempotent (2nd sent=${feedback2.sent})`);

  // ==== HIT baseline cron ====
  console.log("\n  TEST: /api/cron/growing-together-baseline");
  const baselineRes = await fetch(`${SITE}/api/cron/growing-together-baseline`);
  const baselineBody = await baselineRes.json();
  console.log("    →", baselineRes.status, JSON.stringify(baselineBody));
  assert(baselineRes.status === 200 && baselineBody.ok, "baseline cron returned ok");
  assert(baselineBody.sent >= 1, `baseline cron sent ≥1 (${baselineBody.sent})`);

  const { data: inv } = await admin
    .from("outcome_invitations")
    .select("id, token, timepoint, programme_strand, recipient_email, email_sent_at")
    .eq("recipient_email", email)
    .eq("programme_strand", "growing_together")
    .maybeSingle();
  assert(!!inv, "outcome_invitation created for parent");
  if (inv) {
    assert(inv.timepoint === "baseline", `invitation timepoint = baseline (${inv.timepoint})`);
    assert(!!inv.email_sent_at, "invitation.email_sent_at populated");
    assert(!!inv.token && inv.token.length >= 20, `invitation has secure token (${inv.token?.slice(0, 8)}…)`);
  }

  // Idempotency — running again should skip
  const baseline2 = await (await fetch(`${SITE}/api/cron/growing-together-baseline`)).json();
  assert(baseline2.sent === 0 && baseline2.skipped >= 1, `baseline cron is idempotent (2nd sent=${baseline2.sent} skipped=${baseline2.skipped})`);

  // Cleanup
  console.log("\n  cleanup…");
  if (inv) await admin.from("outcome_invitations").delete().eq("id", inv.id);
  await admin.from("outcome_participants").delete().eq("email", email);
  await admin.from("email_logs").delete().eq("recipient_email", email);
  await admin.from("registration_children").delete().eq("registration_id", regId);
  await admin.from("registrations").delete().eq("id", regId);
  await admin.from("children").delete().eq("family_id", familyId);
  await admin.from("parent_carers").delete().eq("family_id", familyId);
  await admin.from("families").delete().eq("id", familyId);
  await admin.from("events").delete().eq("id", eventId);

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\n✓ Slice 5 smoke test PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
