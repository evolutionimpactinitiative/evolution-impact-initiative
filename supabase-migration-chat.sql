-- ============================================
-- Family ↔ Team chat
-- ============================================
-- Model: ONE open thread per family, forever. Admin can "resolve" a
-- thread (sets status='resolved') to archive it; if the family messages
-- again the send-message service reopens it. The family never sees the
-- open/resolved state — they just see a single conversation.
--
-- Admin surface is a shared inbox: any team_member can read and reply to
-- any thread. Optional assignment (assigned_admin_id) powers the "Mine"
-- filter. Thread-level "needs reply" state (last_message_by='family')
-- drives the default admin sort — no per-admin unread tracking.
--
-- Family-side unread lives in the shared `notifications` table (type
-- 'chat_message') so the portal bell and digest don't need duplicate
-- plumbing.


-- ============================================
-- chat_threads
-- ============================================
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),
  assigned_admin_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_by TEXT CHECK (last_message_by IN ('family', 'team')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One thread per family (ever). The reopen flow sets status back to
-- 'open' rather than inserting a new row.
CREATE UNIQUE INDEX IF NOT EXISTS ux_chat_threads_family
  ON chat_threads (family_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_status_last_msg
  ON chat_threads (status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_threads_assigned
  ON chat_threads (assigned_admin_id)
  WHERE assigned_admin_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_chat_threads_updated_at ON chat_threads;
CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- chat_messages
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('family', 'team')),
  -- Exactly one of these should be non-null, matched to sender_type.
  sender_carer_id UUID REFERENCES parent_carers(id) ON DELETE SET NULL,
  sender_team_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  read_by_family_at TIMESTAMPTZ,
  read_by_team_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message history for a thread, oldest first.
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
  ON chat_messages (thread_id, created_at ASC);


-- ============================================
-- chat_attachments
-- ============================================
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message
  ON chat_attachments (message_id);


-- ============================================
-- Extend notifications.type to include chat_message
-- ============================================
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('village_post', 'event_launch', 'chat_message'));


-- ============================================
-- RLS
-- ============================================
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;


-- ---- chat_threads ----
DROP POLICY IF EXISTS "Carer can view own family thread" ON chat_threads;
CREATE POLICY "Carer can view own family thread"
  ON chat_threads FOR SELECT TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team can view all threads" ON chat_threads;
CREATE POLICY "Team can view all threads"
  ON chat_threads FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage threads" ON chat_threads;
CREATE POLICY "Team can manage threads"
  ON chat_threads FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

-- Threads are created server-side via the admin client (send-message
-- service); no INSERT policy for authenticated role.


-- ---- chat_messages ----
DROP POLICY IF EXISTS "Carer can view own family messages" ON chat_messages;
CREATE POLICY "Carer can view own family messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE family_id IN (
        SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
      )
    )
  );

-- Parents mark team messages read on view (update read_by_family_at).
DROP POLICY IF EXISTS "Carer can mark own family messages read" ON chat_messages;
CREATE POLICY "Carer can mark own family messages read"
  ON chat_messages FOR UPDATE TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE family_id IN (
        SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE family_id IN (
        SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Team can view all messages" ON chat_messages;
CREATE POLICY "Team can view all messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage messages" ON chat_messages;
CREATE POLICY "Team can manage messages"
  ON chat_messages FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );


-- ---- chat_attachments ----
DROP POLICY IF EXISTS "Carer can view own family attachments" ON chat_attachments;
CREATE POLICY "Carer can view own family attachments"
  ON chat_attachments FOR SELECT TO authenticated
  USING (
    message_id IN (
      SELECT id FROM chat_messages
      WHERE thread_id IN (
        SELECT id FROM chat_threads
        WHERE family_id IN (
          SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Team can view all attachments" ON chat_attachments;
CREATE POLICY "Team can view all attachments"
  ON chat_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can manage attachments" ON chat_attachments;
CREATE POLICY "Team can manage attachments"
  ON chat_attachments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );


-- ============================================
-- Storage bucket: chat-attachments
-- ============================================
-- Private bucket. Object paths follow the convention
--   {thread_id}/{filename}
-- so the per-family RLS policy below can resolve the family via a join
-- against chat_threads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Parents can SELECT attachment objects for their family's thread.
DROP POLICY IF EXISTS "Carer can read own family chat attachments" ON storage.objects;
CREATE POLICY "Carer can read own family chat attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM chat_threads
      WHERE family_id IN (
        SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
      )
    )
  );

-- Parents can INSERT (upload) attachments into their own thread's folder.
DROP POLICY IF EXISTS "Carer can upload to own family thread" ON storage.objects;
CREATE POLICY "Carer can upload to own family thread"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM chat_threads
      WHERE family_id IN (
        SELECT family_id FROM parent_carers WHERE user_id = auth.uid()
      )
    )
  );

-- Team members: full access to the bucket.
DROP POLICY IF EXISTS "Team can read all chat attachments" ON storage.objects;
CREATE POLICY "Team can read all chat attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can write all chat attachments" ON storage.objects;
CREATE POLICY "Team can write all chat attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "Team can delete chat attachments" ON storage.objects;
CREATE POLICY "Team can delete chat attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt()->>'email')
  );
