-- ============================================
-- Public gallery — albums, images, comments
-- ============================================
-- A single gallery for the CIC's public site, grouped by albums (e.g.
-- "Back to School 2026", "Evolution Fest 2026", "Boxing workshops").
-- Admin uploads images with metadata (title / description / alt text /
-- photographer credit) and drags them into order. Public visitors see
-- the grid and can leave moderated comments — threaded via
-- parent_comment_id.


-- ============================================
-- 1. ALBUMS
-- ============================================

CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_id UUID,             -- FK added after gallery_images is created
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_albums_status_order
  ON gallery_albums(status, display_order);


-- ============================================
-- 2. IMAGES
-- ============================================

CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES gallery_albums(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,      -- e.g. "gallery/xyz.jpg" (Supabase bucket)
  title TEXT,
  description TEXT,
  alt_text TEXT,                   -- for a11y — separate from description
  photographer_credit TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  content_type TEXT,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_album_order
  ON gallery_images(album_id, display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_images_status
  ON gallery_images(status);

-- Full-text search on title + description — used by the public search bar.
CREATE INDEX IF NOT EXISTS idx_gallery_images_search
  ON gallery_images USING gin (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  );

ALTER TABLE gallery_albums
  ADD CONSTRAINT gallery_albums_cover_image_fk
  FOREIGN KEY (cover_image_id) REFERENCES gallery_images(id) ON DELETE SET NULL;


-- ============================================
-- 3. COMMENTS (threaded, moderated)
-- ============================================

CREATE TABLE IF NOT EXISTS gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES gallery_images(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,               -- optional; used only for admin follow-up
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_address INET,                 -- for rate-limiting
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_comments_image_status
  ON gallery_comments(image_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_parent
  ON gallery_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_status
  ON gallery_comments(status, created_at DESC);


-- ============================================
-- 4. TRIGGERS
-- ============================================

CREATE TRIGGER update_gallery_albums_updated_at
  BEFORE UPDATE ON gallery_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 5. RLS
-- ============================================
-- Public reads on published rows; team-only writes.
-- Comments have a wrinkle: anyone can INSERT (public form), but only
-- team can UPDATE/DELETE. Public reads only see 'approved' comments.

ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

-- Albums
CREATE POLICY "Public read published albums"
  ON gallery_albums FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Team read all albums"
  ON gallery_albums FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write albums"
  ON gallery_albums FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

-- Images
CREATE POLICY "Public read published images"
  ON gallery_images FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Team read all images"
  ON gallery_images FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team write images"
  ON gallery_images FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));

-- Comments
CREATE POLICY "Public read approved comments"
  ON gallery_comments FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY "Team read all comments"
  ON gallery_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Public submit comment"
  ON gallery_comments FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'   -- prevents self-approving
  );
CREATE POLICY "Team update comment"
  ON gallery_comments FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));
CREATE POLICY "Team delete comment"
  ON gallery_comments FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
  ));


-- ============================================
-- 6. STORAGE BUCKET
-- ============================================
-- Public-read bucket for gallery images. Uploads restricted to
-- team_members via RLS on storage.objects.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('gallery', 'gallery', true)
  ON CONFLICT (id) DO NOTHING;

-- Team can upload / update / delete objects in this bucket.
DROP POLICY IF EXISTS "Team upload gallery objects" ON storage.objects;
CREATE POLICY "Team upload gallery objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Team update gallery objects" ON storage.objects;
CREATE POLICY "Team update gallery objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gallery'
    AND EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Team delete gallery objects" ON storage.objects;
CREATE POLICY "Team delete gallery objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery'
    AND EXISTS (
      SELECT 1 FROM team_members WHERE team_members.email = auth.jwt() ->> 'email'
    )
  );
