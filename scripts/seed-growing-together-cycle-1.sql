-- ============================================
-- Seed: Growing Together Cycle 1 (6 sessions, Oct 2026 – Jan 2027)
-- Fortnightly Saturdays, 12:00–14:00, The Sunlight Centre, Gillingham.
-- Session 6 breaks cadence to skip Christmas/New Year.
-- ============================================
-- Idempotent: reruns skip rows whose slug is already present.
-- Edit any field in /admin/events after — this only sets the initial
-- shape so /growing-together and the parent portal have something to show.

INSERT INTO events (
  slug, title, short_description, full_description,
  category, event_type, date, start_time, end_time,
  venue_name, venue_address, age_group, cost,
  total_slots, waitlist_slots, max_children_per_registration,
  registration_status, status,
  send_reminder_24h, send_reminder_1h,
  programme, primary_difference, cycle_number, what_to_expect, what_to_bring
) VALUES
-- Session 1 — Come Grow With Us (LAUNCH)
('growing-together-welcome-and-belong-2026',
 'Come Grow With Us',
 'Our first Growing Together session. Meet the team, meet other families, and settle into the Growing Together experience. Children aged 0–5 with their parents or carers.',
 'This is where it all begins.

Come Grow With Us is the very first Growing Together session. A free Saturday afternoon of play, laughter, music and a little bit of mess, built for Medway families with children aged 0 to 5.

This first session is all about getting to know you, and letting you get to know us. From the moment you walk in, you''ll find a warm, calm space set up for little ones to explore at their own pace, with creative stations, sensory play, songs, stories, and plenty of room to just be. There''s no right way to join in. Some children will dive straight in. Some will watch for ten minutes from the safety of your lap. Both are perfect.

While they explore, you''ll meet the Growing Together team and other local parents and carers. People in the same season of life, people who get it. There''ll be a cuppa, a seat, and a conversation if you want one, and none of the pressure if you don''t.

Before we close, we''ll share a first look at what''s coming over the next three months. Six sessions in total, each one a little different. And because this programme is being built with families, not just for them, we want to hear what matters to you from day one.

No experience needed. No fancy outfits needed. Just you, your little one, and a willingness to join in.

Because when children grow, families grow. And when families grow together, communities become stronger.

Saturday 17 October • 12:00–2:00pm • The Sunlight Centre, 105 Richmond Road, Gillingham ME7 1LX • FREE',
 'family', 'children',
 '2026-10-17', '12:00', '14:00',
 'The Sunlight Centre', '105 Richmond Road, Gillingham, ME7 1LX',
 '0–5 years', 'FREE',
 15, 5, 4,
 'auto', 'published',
 true, true,
 'growing_together', 'belonging', 1,
 'Welcome and free play, gentle circle time with songs and a story, our "All About Me" main activity, parent–child challenge, celebration and take-home artwork.',
 'Nothing needed — we provide everything. Just wear clothes you don''t mind getting a little messy.')

ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (
  slug, title, short_description, full_description,
  category, event_type, date, start_time, end_time,
  venue_name, venue_address, age_group, cost,
  total_slots, waitlist_slots, max_children_per_registration,
  registration_status, status,
  send_reminder_24h, send_reminder_1h,
  programme, primary_difference, cycle_number, what_to_expect, what_to_bring
) VALUES
-- Session 2 — Sensory Explorers
('growing-together-sensory-explorers-2026',
 'Growing Together: Sensory Explorers',
 'Hands-on sensory play — messy, curious, calming. For children aged 0–5 and their grown-ups.',
 'A whole session dedicated to sensory play — the kind children thrive on. We''ll set up different stations for touch, sight, sound, and smell so every child can explore at their own pace, in their own way.

Sensory play supports emotional regulation, curiosity, and confidence. It''s a chance for children to try new textures and materials in a supportive space, and for parents to see how their child responds and settles.

There''s no right or wrong way to take part. Some children dive in, some watch first — both are welcome.',
 'family', 'children',
 '2026-10-31', '12:00', '14:00',
 'The Sunlight Centre', '105 Richmond Road, Gillingham, ME7 1LX',
 '0–5 years', 'FREE',
 15, 5, 4,
 'auto', 'published',
 true, true,
 'growing_together', 'confidence', 1,
 'Free play with sensory stations, circle time, guided exploration, parent–child challenge, reflection and a take-home sensory activity.',
 'Clothes you don''t mind getting messy. A change of clothes if your little one is likely to want one.')

ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (
  slug, title, short_description, full_description,
  category, event_type, date, start_time, end_time,
  venue_name, venue_address, age_group, cost,
  total_slots, waitlist_slots, max_children_per_registration,
  registration_status, status,
  send_reminder_24h, send_reminder_1h,
  programme, primary_difference, cycle_number, what_to_expect, what_to_bring
) VALUES
-- Session 3 — Storytelling Together
('growing-together-storytelling-together-2026',
 'Growing Together: Storytelling Together',
 'Shared reading, songs and stories that grow language, connection, and confidence.',
 'This session is all about the magic that happens when a grown-up and a child share a story. We''ll read together, sing together, and play story games that support communication and early literacy.

Parents and carers will pick up simple techniques for reading with young children — how to bring a story to life, when to pause, how to invite your child in. Every family takes home a book to keep.

Great for children who love books already and great for children who are just discovering them.',
 'family', 'children',
 '2026-11-14', '12:00', '14:00',
 'The Sunlight Centre', '105 Richmond Road, Gillingham, ME7 1LX',
 '0–5 years', 'FREE',
 15, 5, 4,
 'auto', 'published',
 true, true,
 'growing_together', 'connection', 1,
 'Free play with books, circle time and a shared story, parent–child reading corner, storytelling games, celebration and a book to take home.',
 'Nothing needed — books and materials provided.')

ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (
  slug, title, short_description, full_description,
  category, event_type, date, start_time, end_time,
  venue_name, venue_address, age_group, cost,
  total_slots, waitlist_slots, max_children_per_registration,
  registration_status, status,
  send_reminder_24h, send_reminder_1h,
  programme, primary_difference, cycle_number, what_to_expect, what_to_bring
) VALUES
-- Session 4 — Music & Movement
('growing-together-music-and-movement-2026',
 'Growing Together: Music & Movement',
 'Songs, rhythms and movement to build confidence, expression and joyful connection.',
 'Music and movement give children a way to express themselves before they have all the words. In this session we''ll sing, dance, drum, and play with instruments from around the world.

Children build confidence by trying new sounds and rhythms in a supportive group. Parents and carers learn simple songs and games to take home. Every family finds something that clicks.

No musical experience needed — just come ready to be a bit silly.',
 'family', 'children',
 '2026-11-28', '12:00', '14:00',
 'The Sunlight Centre', '105 Richmond Road, Gillingham, ME7 1LX',
 '0–5 years', 'FREE',
 15, 5, 4,
 'auto', 'published',
 true, true,
 'growing_together', 'confidence', 1,
 'Free play with instruments, circle time with songs, movement games, parent–child duet challenge, celebration and take-home songs.',
 'Comfortable clothes you can move in. Instruments provided.')

ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (
  slug, title, short_description, full_description,
  category, event_type, date, start_time, end_time,
  venue_name, venue_address, age_group, cost,
  total_slots, waitlist_slots, max_children_per_registration,
  registration_status, status,
  send_reminder_24h, send_reminder_1h,
  programme, primary_difference, cycle_number, what_to_expect, what_to_bring
) VALUES
-- Session 5 — Little Garden Makers
('growing-together-little-garden-makers-2026',
 'Growing Together: Little Garden Makers',
 'Nature-based creative play. Children plant, dig, discover, and take home something they''ve grown.',
 'A gently outdoors-focused session (indoors if the weather is against us) about connecting with nature, our neighbourhood, and each other. Children plant seeds, explore natural materials, and take part in a group project the whole community can enjoy.

We''ll talk about the plants and foods that matter in different families'' cultures — a chance for children to see their heritage reflected in what we do, and for families to share.

Every child takes home something they''ve planted.',
 'family', 'children',
 '2026-12-12', '12:00', '14:00',
 'The Sunlight Centre', '105 Richmond Road, Gillingham, ME7 1LX',
 '0–5 years', 'FREE',
 15, 5, 4,
 'auto', 'published',
 true, true,
 'growing_together', 'belonging', 1,
 'Nature-themed free play, circle time, planting activity, parent–child challenge, celebration and a plant to take home.',
 'Warm clothes and something you don''t mind getting a bit muddy. Wellies welcome.')

ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (
  slug, title, short_description, full_description,
  category, event_type, date, start_time, end_time,
  venue_name, venue_address, age_group, cost,
  total_slots, waitlist_slots, max_children_per_registration,
  registration_status, status,
  send_reminder_24h, send_reminder_1h,
  programme, primary_difference, cycle_number, what_to_expect, what_to_bring
) VALUES
-- Session 6 — Family Celebration
('growing-together-family-celebration-2026',
 'Growing Together: Family Celebration',
 'A celebration to close Cycle 1. Look back at everything our families have done, and share what''s next.',
 'The final session of Cycle 1 is a celebration. We look back at the sessions we''ve shared, we spotlight the milestones our children have reached, and we share food, songs and stories together.

Every family that has attended a Cycle 1 session is invited. This is also where we listen — we want to hear what''s been meaningful, what could be better, and what families want to see in Cycle 2.

Come hungry, come proud.',
 'family', 'children',
 '2027-01-09', '12:00', '14:00',
 'The Sunlight Centre', '105 Richmond Road, Gillingham, ME7 1LX',
 '0–5 years', 'FREE',
 15, 5, 4,
 'auto', 'published',
 true, true,
 'growing_together', 'connection', 1,
 'Welcome and free play, circle time with a look-back at Cycle 1, celebration activity, shared food, family feedback, and take-home Cycle 1 keepsake.',
 'Just yourselves. Food and materials provided.')

ON CONFLICT (slug) DO NOTHING;
