-- ============================================
-- Growing Together — Our Village (moderated community feed)
-- ============================================
-- A team-curated feed inside the parent portal. NO parent-to-parent messaging,
-- comments, or DMs — this is deliberately one-way (staff → families) for
-- safeguarding.
--
-- One table (`village_posts`) with a `category` discriminator so admin CRUD
-- stays simple and the feed can filter by category. Category-specific fields
-- (event_date, provider_contact, link_url) live on the same row; the form
-- shows only what's relevant.


-- ============================================
-- 1. TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS village_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL
    CHECK (category IN (
      'activity',           -- upcoming community activity
      'announcement',       -- family announcement
      'local_service',      -- useful local service
      'programme_update',   -- Growing Together update
      'resource'            -- parent resource (article, video, guide)
    )),
  title TEXT NOT NULL,
  body TEXT,                                    -- HTML from Tiptap editor
  cover_image_url TEXT,

  -- Optional call-to-action link (any category)
  link_url TEXT,
  link_label TEXT,

  -- Activities
  event_date DATE,
  event_time TIME,
  venue TEXT,

  -- Local services
  provider_name TEXT,
  provider_contact TEXT,

  author_name TEXT,                             -- attribution (e.g. "Macram, Programme Lead")
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                       -- auto-hide after this (e.g. past activities)

  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed queries: published, not expired, ordered by pinned+published_at
CREATE INDEX IF NOT EXISTS idx_village_posts_feed
  ON village_posts (status, pinned DESC, published_at DESC)
  WHERE status = 'published';

-- Category filter
CREATE INDEX IF NOT EXISTS idx_village_posts_category
  ON village_posts (category, status);


-- ============================================
-- 2. TRIGGER — keep updated_at fresh
-- ============================================
DROP TRIGGER IF EXISTS update_village_posts_updated_at ON village_posts;
CREATE TRIGGER update_village_posts_updated_at BEFORE UPDATE ON village_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 3. RLS
-- ============================================
ALTER TABLE village_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read published village posts" ON village_posts;
CREATE POLICY "Anyone read published village posts"
  ON village_posts FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS "Team read all village posts" ON village_posts;
CREATE POLICY "Team read all village posts"
  ON village_posts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

DROP POLICY IF EXISTS "Team write village posts" ON village_posts;
CREATE POLICY "Team write village posts"
  ON village_posts FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));


-- ============================================
-- 4. STORAGE BUCKET — village-images
-- ============================================
-- Public-read bucket for cover images. Team-only writes via RLS.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('village-images', 'village-images', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Team upload village-images" ON storage.objects;
CREATE POLICY "Team upload village-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'village-images'
    AND EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Team update village-images" ON storage.objects;
CREATE POLICY "Team update village-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'village-images'
    AND EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Team delete village-images" ON storage.objects;
CREATE POLICY "Team delete village-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'village-images'
    AND EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );
