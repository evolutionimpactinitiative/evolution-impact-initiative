# Growing Together — Build Plan

Early Years family portal and programme for Evolution Impact Initiative CIC, funded by BBC Children in Need "We Move Fwd: Foundations" (£75k over 3 years, £25k/yr, 24 free sessions/yr for children aged 0–5).

Full functional spec: see the "Growing Together Family Portal & Early Years Programme" brief. This plan translates that spec into shippable slices for the existing Next.js 16 + Supabase codebase.

---

## Locked design decisions

1. **Parent auth = email + password** (Supabase `signInWithPassword`). Admin login stays on magic link; only parents get password auth. Enforce email verification before allowing session registration.
2. **Sessions extend `events`** — add `programme` and `primary_difference` columns rather than a parallel `growing_together_sessions` table. Reuses existing registration, waitlist, attendance, QR, and reminder infrastructure unchanged.
3. **Household family model** — `families` → many `parent_carers` (each with own login) → many `children`. Registration to a session materialises `registrations` + `registration_children` rows from the persistent `children` records.
4. **Baseline questionnaire fires 24h after first attended session**, not during sign-up. Reuses `outcome_invitations` token flow. Instrument: new "Growing Together Baseline", 6 statements from spec §14.
5. **New "Safeguarding Lead" role** on `team_members`, scoping safeguarding fields on session evaluations and observation logs.

---

## Reuse map

Growing Together sits on top of infrastructure that already exists. New work is smaller than the spec length suggests.

| Spec area | Existing thing | New work |
|---|---|---|
| Sessions (§8, §21, §32) | `events` + `registrations` + `registration_children`, admin CRUD, waitlist, QR | Add `programme` + `primary_difference` columns; filter by programme |
| Attendance (§33) | `registrations.attended`, check-in flow, QR tokens | None — reuse |
| Feedback (§27) | `surveys` + `survey_responses` + `/feedback/[id]` | Add "Post-Session Feedback" survey + auto-send trigger |
| Baseline & outcome check-ins (§14, §28) | `outcome_instruments` + `outcome_invitations` + `outcome_responses` (already models baseline/midpoint/follow_up + `programme_strand`) | Seed "Growing Together Baseline" instrument |
| Emails (§45, §51) | Resend + `lib/email/templates.ts` + `email_logs` | ~6 new templates |
| Admin dashboard, roles, RLS (§29, §54) | `team_members`, `permissions.ts`, `AdminSidebar` | Add Growing Together section + Safeguarding Lead role |
| Impact dashboard (§36) | Outcome scoring per response, per `programme_strand` | New page over existing tables |
| CiN reporting (§37) | Outcomes + registrations already carry the data | Reporting worksheet |

### Genuinely new pieces

- **Parent account system** — first public accounts in the codebase (everything user-facing is anonymous today).
- **`families`, `parent_carers`, `children` tables** — persistent household records, distinct from per-event `registration_children`.
- **`/portal` route group** — parent-facing app, mobile-first (spec §50).
- **`programme` + `primary_difference` columns on `events`**.
- **Small new tables:** `family_milestones`, `growing_together_resources`, `family_needs_signals`.

Everything else in the spec is achievable with what's built.

---

## Data model additions

### New tables

```
families
  id, created_at, postcode, preferred_contact_method, preferred_language,
  how_heard_about_gt, accessibility_requirements (text),
  interests (text[]), support_areas (text[])

parent_carers
  id, family_id (fk), user_id (fk auth.users), name, email (unique), phone,
  relationship_to_child (text), is_primary (bool), email_verified_at, created_at

children
  id, family_id (fk), first_name, date_of_birth, sex_at_birth (nullable),
  interests (text[]), accessibility_requirements, communication_notes,
  allergies (text, nullable), support_areas (text[]), parent_notes,
  created_at, archived_at (nullable — for children who age out at 5)

family_milestones
  id, family_id, child_id (nullable — some milestones are family-level),
  milestone_code (enum), awarded_at, awarded_by (team_member_id, nullable),
  session_id (nullable — link to the event that triggered it), note

growing_together_resources
  id, title, category (enum), summary, body_md, attachment_url (nullable),
  age_range_min, age_range_max, difference_tag (nullable),
  published_at, created_by, updated_at

family_needs_signals
  id, family_id, signal_type (enum — talk_to_someone, find_resources,
  find_activities, professional_advice, meet_families, parent_support,
  child_development), note, status (open|acknowledged|actioned|closed),
  created_at, actioned_by, actioned_at

session_observations
  id, event_id, family_id (nullable), child_id (nullable),
  observation_text, difference_tag (confidence|connection|belonging),
  is_safeguarding (bool), recorded_by (team_member_id), created_at

session_evaluations
  id, event_id (unique), what_went_well, what_didnt, num_children,
  num_parents, num_new_families, num_returning_families, key_quotes (text[]),
  improvements_for_next_time, has_safeguarding_concerns (bool),
  safeguarding_notes (restricted to Safeguarding Lead role via RLS),
  recorded_by, created_at
```

### Column additions

```
events
  + programme text nullable                    -- 'growing_together' etc.
  + primary_difference text nullable           -- 'confidence' | 'connection' | 'belonging'
  + cycle_number int nullable                  -- 1..4 within programme year
  + what_to_expect text nullable
  + what_to_bring text nullable

registrations
  + family_id uuid nullable (fk families)      -- populated when a portal user registers
  + registered_by_parent_carer_id uuid nullable

registration_children
  + child_id uuid nullable (fk children)       -- link back to the persistent child record

team_members.role
  + 'safeguarding_lead' as valid value
```

Backward compatibility: all new columns are nullable. Existing anonymous event registrations continue to work unchanged.

### RLS pattern for the portal

- `families`, `parent_carers`, `children`: a parent can `SELECT`/`UPDATE` rows where the parent's `auth.uid()` matches a `parent_carers.user_id` in the same family. No cross-family visibility.
- `family_needs_signals`, `family_milestones`: parents can read their own, only team can write.
- `session_observations`: parents cannot read; only team.
- `session_evaluations.safeguarding_notes`: policy restricts SELECT to team members where `role = 'safeguarding_lead'` or `role = 'admin'`.

---

## Phased build

Six slices for Phase 1 (MVP), aligned with spec §56. Each slice is independently shippable and demo-able.

### Slice 1 — Public face (~1 day)

- Migration: add `programme`, `primary_difference`, `cycle_number`, `what_to_expect`, `what_to_bring` columns to `events`.
- Public page `/growing-together`:
  - Hero (§5)
  - Three differences (§6)
  - How it works (§7)
  - Upcoming sessions (§8) — reads `events WHERE programme = 'growing_together'` and status published
  - CTAs to `/portal/join` and session detail pages
- Reusable component: `GrowingTogetherSessionCard`.
- Extend admin event form to expose the new fields and mark an event as part of Growing Together.

**Ship criterion:** Chair can create a GT-flagged event in admin and it renders on the public `/growing-together` page.

### Slice 2 — Parent accounts + family/child profiles (~2 days)

- Migrations: `families`, `parent_carers`, `children`, plus RLS.
- Route group `app/(parent)/portal/`:
  - `/portal/join` — email + password sign-up, creates auth.users + parent_carers + families row
  - `/portal/verify-email` — Supabase email verification handoff
  - `/portal/login`, `/portal/forgot-password`, `/portal/reset-password`
  - `/portal/family` — "My Family" screen: parent details, add/edit children (§11, §13)
- Middleware: gate `/portal/*` (except join/login/forgot/reset/verify) on auth + email verified + family record exists.
- Emails: welcome + verify.

**Ship criterion:** A new parent can sign up, verify email, log in, add themselves + partner + one child, and see their family on `/portal/family`.

### Slice 3 — Register a family for a session (~1 day)

- Logged-in parent visits a GT session page and sees "Register My Family" with checkboxes for their children (§21).
- `/api/registrations/create` extended to accept `{ family_id, parent_carer_id, child_ids[] }` — server materialises the existing `registrations` + `registration_children` rows so admin/attendance/QR flows keep working.
- Waitlist reuses existing `registration_mode`.
- Session detail on `/growing-together/sessions/[slug]`: description, date, time, venue, age suitability, what to expect, what to bring, accessibility, available spaces, primary difference.
- Emails: registration confirmation, waitlist confirmation.

**Ship criterion:** Parent registers two of their three children for a GT session; admin sees the registration in the existing `/admin/registrations` table with `family_id` populated.

### Slice 4 — Parent dashboard (~1 day)

- `/portal` — the dashboard (§15–§17, §20):
  - "Good morning, {name}" banner
  - "Your Next Adventure" card — next confirmed registration
  - Family summary card
  - Sessions attended count
  - Upcoming sessions list
  - Previous sessions list
- Read-only in this slice — no journey/milestones yet.

**Ship criterion:** Parent logs in and sees a dashboard that reflects their real data.

### Slice 5 — Baseline + post-session feedback (~1 day)

- Seed instrument in `outcome_instruments`: "Growing Together Baseline" with the 6 statements from spec §14, 1–5 scale, `programme_strand = 'growing_together'`.
- Seed survey in `surveys`: "Growing Together Post-Session Feedback" with questions from spec §27.
- Cron job at `/api/cron/growing-together-baseline`: for any parent whose first GT attendance was ≥24h ago and who has no baseline invitation yet, create + email an `outcome_invitation` with `timepoint='baseline'`.
- Cron job at `/api/cron/growing-together-feedback`: for each attended session in the last 24h, email each parent a survey link.
- Reuses existing `/outcomes/[token]` and `/feedback/[id]` public pages.

**Ship criterion:** A parent who attends their first session gets a baseline email 24h later; a parent who attends any session gets a feedback email 24h later.

### Slice 6 — Admin overview + Safeguarding Lead role (~1 day)

- Add `'safeguarding_lead'` to team_members.role enum + `lib/permissions.ts`.
- `/admin/growing-together` — dashboard (§29):
  - Families registered
  - Children registered
  - Sessions delivered
  - Total attendance
  - New vs. returning families
  - Waitlist count
  - Average attendance
  - Latest feedback average (from the seeded survey)
- Extend `AdminSidebar` with Growing Together section (visible to admins, editors, and safeguarding leads).
- Family list view: search, filter, drill-in to family detail (children, attendance, feedback summary).

**Ship criterion:** Chair opens `/admin/growing-together` and sees live numbers reflecting Slices 1–5.

---

## Post-MVP phases

### Phase 2 — before Cycle 2 starts

- Family Journey (§18) — visual progress display on `/portal`.
- Milestones (§19) — `family_milestones` writes triggered by attendance patterns + manual admin awards.
- Resources library (§24) — admin CRUD on `growing_together_resources`, public list on `/portal/resources`.
- "Tell us what you need" widget (§26) — writes to `family_needs_signals`, shows in admin.
- Detailed session-level feedback beyond the 5-question survey.
- 3-month review workflow (§38) — admin-only page that aggregates a cycle's participation, feedback, outcome deltas, and family needs.

### Phase 3 — before Cycle 3

- Full Impact Dashboard (§36) by difference — reads baseline vs. follow-up deltas from `outcome_responses`.
- Automated CiN report worksheet (§37) matching the CiN online portal's 8 sections.
- Case-study management (curated anonymised quotes + stories).
- Outcome-trend charts by cycle.

### Phase 4 — optional, capacity permitting

- Our Village community area (§25) — moderated, no direct parent-to-parent messaging in v1.
- Session recommendations (§23).
- Partner referrals (§42) + Growing Together Partner Referral Pack.
- Local support-services directory.

---

## Session content (spec §39, §57, §58)

Content sits alongside the platform build — not blocked by it, but the platform must be ready to accept the first Cycle 1 sessions:

- Session 1: Welcome & Belong (launch)
- Session 2: Sensory Explorers
- Session 3: Storytelling Together
- Session 4: Music & Movement
- Session 5: Little Garden Makers
- Session 6: Family Celebration

Chair creates these as GT-flagged events in admin once Slice 1 lands.

---

## Launch

**Welcome & Belong: Saturday 19 September 2026, 13:00–15:00.** All six slices must be live by this date so families can register through the portal in the run-up. Recommended lock date for feature freeze: **Monday 14 September** (5 days of buffer for content, dry-run, and safeguarding sign-off).

## Portal path

Parent portal lives at **`/portal`** (short, programme-agnostic). Future programme strands can share it.

## Open questions

1. Photography consent (§48) — single field on `families`, or per-registration? Recommend both: default from family, overridable per session.
2. Should partners of a Chair-managed family also be able to self-invite via a link the primary parent generates, or does the primary parent add the partner manually? Deferrable to Phase 2.

---

## Non-goals for MVP

Explicitly out of scope for Phase 1 so we don't drift:

- Recommended sessions (§23)
- Our Village (§25)
- Full Impact Dashboard (§36) — a basic count/average dashboard in Slice 6 only
- Partner referral pack (§42)
- Community/peer messaging
- Personalisation beyond "which of your children is attending"

These land in Phase 2–4.
