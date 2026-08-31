// Slice 3 end-to-end smoke test.
//   npx tsx scripts/smoke-slice-3.ts
//
// Seeds a Growing Together event + a test parent + two children (one
// eligible for 0–5, one too old), logs the parent in, then drives
// /api/portal/register-session through the age-eligibility, happy-path,
// and duplicate-guard cases. Cleans up everything after.

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
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const projectRef = new URL(SUPABASE_URL).host.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;

let failed = 0;
function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg: string): never {
  console.error(`  ✗ ${msg}`);
  process.exit(1);
}

async function main() {
  const slug = `slice3-smoketest-${Date.now()}`;
  const email = `slice3-parent-${Date.now()}@example.com`;
  const password = "testpassword123";

  // 1) Seed GT event
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14);
  const { data: event, error: eventErr } = await admin
    .from("events")
    .insert({
      slug,
      title: "Slice 3 Smoke Session",
      short_description: "Ephemeral test session.",
      category: "family",
      event_type: "children",
      date: eventDate.toISOString().slice(0, 10),
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
      what_to_expect: "Welcome, free play, circle time, activity, celebration.",
    })
    .select("id")
    .single();
  if (eventErr || !event) fail(`seed event: ${eventErr?.message}`);
  const eventId = event.id;

  // 2) Create parent via real signup API
  const signupRes = await fetch(`${SITE}/api/portal/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      name: "Slice3 Parent",
      phone: "07000000000",
      postcode: "ME1 1YD",
      relationship_to_child: "mother",
    }),
  });
  const signupBody = await signupRes.json();
  if (!signupRes.ok || !signupBody.ok) fail(`signup: ${JSON.stringify(signupBody)}`);

  // 3) Fetch the auth user + auto-confirm email
  const { data: userList } = await admin.auth.admin.listUsers();
  const authUser = userList.users.find((u) => u.email === email);
  if (!authUser) fail("auth user not found after signup");
  await admin.auth.admin.updateUserById(authUser.id, { email_confirm: true });

  // 4) Fetch family + insert two children
  const { data: carer } = await admin
    .from("parent_carers")
    .select("family_id")
    .eq("email", email)
    .maybeSingle();
  if (!carer) fail("parent_carer not found");
  const familyId = carer.family_id;

  const dobYoung = new Date();
  dobYoung.setFullYear(dobYoung.getFullYear() - 3);
  const dobOld = new Date();
  dobOld.setFullYear(dobOld.getFullYear() - 8);

  const { data: youngRow } = await admin
    .from("children")
    .insert({
      family_id: familyId,
      first_name: "Amara",
      date_of_birth: dobYoung.toISOString().slice(0, 10),
      sex_at_birth: "female",
    })
    .select("id")
    .single();
  const { data: oldRow } = await admin
    .from("children")
    .insert({
      family_id: familyId,
      first_name: "Jayden",
      date_of_birth: dobOld.toISOString().slice(0, 10),
      sex_at_birth: "male",
    })
    .select("id")
    .single();
  const childYoungId = youngRow!.id;
  const childOldId = oldRow!.id;

  pass(`seeded event=${eventId.slice(0, 8)} family=${familyId.slice(0, 8)} young=${childYoungId.slice(0, 8)} old=${childOldId.slice(0, 8)}`);

  // 5) Log in — build the SSR auth cookie from the real session
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data: signInData, error: signInErr } = await supa.auth.signInWithPassword({ email, password });
  if (signInErr || !signInData.session) fail(`signIn: ${signInErr?.message}`);

  const s = signInData.session;
  const sessionJson = JSON.stringify({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: s.expires_in,
    expires_at: s.expires_at,
    token_type: s.token_type,
    user: s.user,
  });
  const cookieValue = `base64-${Buffer.from(sessionJson).toString("base64")}`;
  const cookieHeader = `${cookieName}=${cookieValue}`;

  const call = async (childIds: string[], label: string) => {
    const res = await fetch(`${SITE}/api/portal/register-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ eventId, childIds }),
    });
    const body = await res.json();
    console.log(`    ${label} → ${res.status} ${JSON.stringify(body)}`);
    return { status: res.status, body };
  };

  // TEST 1: both children — age check should reject
  console.log("\n  TEST 1: both children (expect 400 age)");
  const t1 = await call([childYoungId, childOldId], "both");
  if (t1.status !== 400 || !String(t1.body.error).toLowerCase().includes("older than 5")) {
    fail("Age eligibility check did not fire");
  }
  pass("age check rejected 8-year-old");

  // TEST 2: just the eligible child — should succeed
  console.log("\n  TEST 2: just eligible child (expect 200 confirmed)");
  const t2 = await call([childYoungId], "young");
  if (t2.status !== 200 || t2.body.status !== "confirmed") {
    fail("Expected confirmed registration");
  }
  pass(`registration created: ${t2.body.registrationId.slice(0, 8)}`);

  // TEST 3: duplicate — should 409
  console.log("\n  TEST 3: duplicate (expect 409)");
  const t3 = await call([childYoungId], "again");
  if (t3.status !== 409) fail("Expected 409 duplicate");
  pass("duplicate guard fired");

  // DB backlink checks
  console.log("\n  DB state:");
  const { data: regs } = await admin
    .from("registrations")
    .select("id, status, family_id, registered_by_parent_carer_id, parent_name")
    .eq("event_id", eventId);
  if (!regs || regs.length !== 1) fail(`Expected 1 registration, got ${regs?.length ?? 0}`);
  if (regs[0].family_id !== familyId) fail("family_id backlink missing/wrong");
  if (!regs[0].registered_by_parent_carer_id) fail("registered_by_parent_carer_id null");
  pass(`registration has family + carer backlinks (${regs[0].parent_name})`);

  const { data: rcs } = await admin
    .from("registration_children")
    .select("child_name, child_age, child_id")
    .eq("registration_id", regs[0].id);
  if (!rcs || rcs.length !== 1) fail("expected 1 registration_child");
  if (rcs[0].child_id !== childYoungId) fail("child_id backlink wrong");
  if (rcs[0].child_age !== 3) fail(`child_age wrong (${rcs[0].child_age})`);
  pass(`registration_children linked to child (age ${rcs[0].child_age})`);

  // Cleanup
  console.log("\n  cleanup…");
  await admin.from("registration_children").delete().eq("registration_id", regs[0].id);
  await admin.from("registrations").delete().eq("event_id", eventId);
  await admin.from("children").delete().eq("family_id", familyId);
  await admin.from("parent_carers").delete().eq("email", email);
  await admin.from("families").delete().eq("id", familyId);
  await admin.from("events").delete().eq("id", eventId);
  await admin.auth.admin.deleteUser(authUser.id);

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\n✓ Slice 3 smoke test PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
