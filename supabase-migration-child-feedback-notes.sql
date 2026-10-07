-- ============================================
-- Child session feedback (ratings) + Notes
-- ============================================
-- Two features at once because they share plumbing:
--
--   child_session_feedback  — 7 per-child ratings for each session a
--     child attends, plus a free-text "anything notable" line. Team-
--     only data; drives CiN outcomes reporting (Confidence /
--     Connection / Belonging). UNIQUE(child_id, event_id) so each
--     child has at most one feedback row per session; the form upserts.
--
--   notes  — polymorphic (target_type='family'|'child') notes with
--     visibility ('internal'|'external'). Internal = team only.
--     External = also visible to the family on /portal/family, and
--     fires an in-app + email notification to carers at write time.
--
-- The notification type enum is extended for the external-note surface.


-- ============================================
-- child_session_feedback
-- ============================================
CREATE TABLE IF NOT EXISTS child_session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  settling_in TEXT CHECK (settling_in IN ('needs_support','doing_well','thriving')),
  engagement TEXT CHECK (engagement IN ('needs_support','doing_well','thriving')),
  confidence TEXT CHECK (confidence IN ('needs_support','doing_well','thriving')),
  social_connection TEXT CHECK (social_connection IN ('needs_support','doing_well','thriving')),
  communication TEXT CHECK (communication IN ('needs_support','doing_well','thriving')),
  emotional_regulation TEXT CHECK (emotional_regulation IN ('needs_support','doing_well','thriving')),
  parent_child_connection TEXT CHECK (parent_child_connection IN ('needs_support','doing_well','thriving')),
  notable TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_child_feedback_child_created
  ON child_session_feedback (child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_feedback_event
  ON child_session_feedback (event_id);

DROP TRIGGER IF EXISTS update_child_feedback_updated_at ON child_session_feedback;
CREATE TRIGGER update_child_feedback_updated_at BEFORE UPDATE ON child_session_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- notes
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('family','child')),
  target_id UUID NOT NULL,
  author_team_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal','external')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query shapes:
--   • "all notes for a family" → (target_type='family', target_id=X)
--     union with (target_type='child', target_id IN children-of-X)
--   • parent-visible notes → the above filtered to visibility='external'
CREATE INDEX IF NOT EXISTS idx_notes_target
  ON notes (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_visibility
  ON notes (visibility);

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Extend notifications.type for external_note
-- ============================================
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('village_post', 'event_launch', 'chat_message', 'external_note'));


-- ============================================
-- RLS
-- ============================================
ALTER TABLE child_session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;


-- ---- child_session_feedback (team-only) ----
DROP POLICY IF EXISTS "Team can read all feedback" ON child_session_feedback;
CREATE POLICY "Team can read all feedback"
  ON child_session_feedback FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage all feedback" ON child_session_feedback;
CREATE POLICY "Team can manage all feedback"
  ON child_session_feedback FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );
-- Parents can't see ratings — intentionally no SELECT policy for them.


-- ---- notes ----
-- Team: full access.
DROP POLICY IF EXISTS "Team can read all notes" ON notes;
CREATE POLICY "Team can read all notes"
  ON notes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage all notes" ON notes;
CREATE POLICY "Team can manage all notes"
  ON notes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

-- Parent: can read external notes about their family or their family's children.
DROP POLICY IF EXISTS "Carer can read own external notes" ON notes;
CREATE POLICY "Carer can read own external notes"
  ON notes FOR SELECT TO authenticated
  USING (
    visibility = 'external' AND (
      (
        target_type = 'family'
        AND target_id IN (
          SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
        )
      )
      OR (
        target_type = 'child'
        AND target_id IN (
          SELECT id FROM children
          WHERE family_id IN (
            SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
          )
        )
      )
    )
  );
