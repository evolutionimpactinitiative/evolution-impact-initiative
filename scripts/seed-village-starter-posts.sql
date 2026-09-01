-- ============================================
-- Our Village — starter posts
-- ============================================
-- Seeds the feed so it doesn't feel empty on launch day.
--
-- Posts marked status='published' go live immediately.
-- Posts marked status='draft' need Macram to review + add local details
-- (venue times, phone numbers, etc.) before publishing.
--
-- Run once from the Supabase SQL Editor. If you re-run, delete the seeded
-- rows first by title, or wrap in a WHERE NOT EXISTS guard.

DO $$
DECLARE
  team_uuid UUID;
BEGIN
  -- Attribute posts to any team member (falls back to NULL if none exist).
  SELECT id INTO team_uuid FROM team_members ORDER BY created_at LIMIT 1;

  -- ── 1. Welcome (pinned, published, programme update) ────────────
  INSERT INTO village_posts (
    category, title, body, author_name, pinned, status, published_at, created_by
  ) VALUES (
    'programme_update',
    'Welcome to Our Village 👋',
    '<p>This is your Growing Together noticeboard — a place where our team shares upcoming activities, useful local services, and small resources we think might help your family.</p>' ||
    '<p>What you''ll find here:</p>' ||
    '<ul>' ||
    '<li>🎉 <strong>Activities</strong> — sessions, trips and community events</li>' ||
    '<li>🏥 <strong>Local services</strong> — health visitors, food banks, family support</li>' ||
    '<li>📚 <strong>Parent resources</strong> — free tools, videos and articles for 0–5s</li>' ||
    '<li>📣 <strong>Announcements</strong> — anything time-sensitive from the team</li>' ||
    '</ul>' ||
    '<p>Our Village is a <strong>read-only space</strong> — there are no comments or messaging here. If you want to reach us, use the contact details in your welcome email or catch us at a session.</p>',
    'Growing Together team',
    TRUE,
    'published',
    NOW(),
    team_uuid
  );

  -- ── 2. Launch session — activity, published ─────────────────────
  INSERT INTO village_posts (
    category, title, body, event_date, event_time, venue,
    link_url, link_label, author_name, status, published_at, expires_at, created_by
  ) VALUES (
    'activity',
    'Welcome & Belong — our launch session',
    '<p>Our very first Growing Together session — a warm, gentle afternoon of play, connection and food for families with children aged 0–5.</p>' ||
    '<p>Expect: sensory play, a story circle, snacks, and a chance to meet other families in the community. Nothing to prepare — just come as you are.</p>',
    '2026-09-19',
    '13:00',
    'To be confirmed — check your registration email',
    '/growing-together',
    'Book your place',
    'Growing Together team',
    'published',
    NOW(),
    -- Auto-hide 2 days after the session so the feed stays fresh
    '2026-09-21 18:00:00+00',
    team_uuid
  );

  -- ── 3. BBC Tiny Happy People — resource, published ──────────────
  INSERT INTO village_posts (
    category, title, body, link_url, link_label, author_name, status, published_at, created_by
  ) VALUES (
    'resource',
    'Tiny Happy People — free tips and videos from the BBC',
    '<p>The BBC has built a huge, free library of short videos and simple activity ideas for children aged 0–4. Everyday moments (nappy changes, bathtime, walks) turned into chances to talk and connect with your child.</p>' ||
    '<p>Filter by your child''s age and pick one activity to try this week — you don''t need to do them all.</p>',
    'https://www.bbc.co.uk/tiny-happy-people',
    'Open Tiny Happy People',
    'Growing Together team',
    'published',
    NOW(),
    team_uuid
  );

  -- ── 4. 5 to Thrive — resource, published ────────────────────────
  INSERT INTO village_posts (
    category, title, body, author_name, status, published_at, created_by
  ) VALUES (
    'resource',
    '5 to Thrive — five simple building blocks for 0–5s',
    '<p>An evidence-based framework used by early years services across the UK. Five everyday things that help babies and young children thrive:</p>' ||
    '<ol>' ||
    '<li><strong>Respond</strong> — notice what your child is telling you</li>' ||
    '<li><strong>Cuddle</strong> — closeness helps their brain grow</li>' ||
    '<li><strong>Relax</strong> — calm moments matter as much as active ones</li>' ||
    '<li><strong>Play</strong> — play is your child''s work</li>' ||
    '<li><strong>Talk</strong> — narrate what you''re both doing, even before they answer</li>' ||
    '</ol>' ||
    '<p>You''re probably already doing most of these. This is just a gentle reminder that the small stuff <em>is</em> the big stuff.</p>',
    'Growing Together team',
    'published',
    NOW(),
    team_uuid
  );

  -- ── 5. Gillingham Hub (Medway) — local service, DRAFT ──────────
  -- Draft because we should add the actual current opening hours and
  -- confirm the address / phone before publishing.
  INSERT INTO village_posts (
    category, title, body, provider_name, provider_contact,
    link_url, link_label, author_name, status, created_by
  ) VALUES (
    'local_service',
    'Gillingham Hub — free support for Medway families with under-5s',
    '<p><strong>Draft — review venue + opening times before publishing.</strong></p>' ||
    '<p>The Gillingham Hub is one of Medway''s Family Hubs, offering free drop-in support for families with children aged 0–19 (up to 25 with additional needs). Services include health visitors, breastfeeding support, weighing, parenting groups, and referrals to specialist services.</p>' ||
    '<p>No appointment needed for most drop-ins. Free.</p>',
    'Gillingham Hub — Medway Family Hubs',
    'Add hub address, phone and opening times here',
    'https://www.medway.gov.uk/familyhubs',
    'Find your local Medway hub',
    'Growing Together team',
    'draft',
    team_uuid
  );

  -- ── 6. Autumn schedule — announcement, DRAFT ────────────────────
  INSERT INTO village_posts (
    category, title, body, author_name, status, created_by
  ) VALUES (
    'announcement',
    'Autumn 2026 — session dates coming soon',
    '<p><strong>Draft — fill in confirmed dates before publishing.</strong></p>' ||
    '<p>We''re finalising our autumn schedule after the Welcome &amp; Belong launch. Expect fortnightly sessions running through October and November, plus one community trip in half-term week.</p>' ||
    '<p>Watch this space — dates land here first, then in your inbox.</p>',
    'Growing Together team',
    'draft',
    team_uuid
  );

END $$;

-- Confirm what landed
SELECT
  category,
  title,
  status,
  pinned,
  CASE WHEN expires_at IS NOT NULL THEN expires_at::DATE::TEXT ELSE '' END AS expires
FROM village_posts
ORDER BY pinned DESC, published_at DESC NULLS LAST, created_at DESC;
