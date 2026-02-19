-- Evolution Impact Initiative - Database Schema
-- Run this in Supabase SQL Editor (supabase.com -> Your Project -> SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEAM MEMBERS (Admin users)
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  category TEXT NOT NULL CHECK (category IN ('creative', 'sport', 'support', 'community')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  card_image_url TEXT,
  hero_image_url TEXT,
  age_group TEXT,
  cost TEXT DEFAULT 'FREE',
  what_to_bring TEXT,
  accessibility_info TEXT,
  total_slots INTEGER NOT NULL DEFAULT 20,
  waitlist_slots INTEGER NOT NULL DEFAULT 10,
  max_children_per_registration INTEGER NOT NULL DEFAULT 2 CHECK (max_children_per_registration BETWEEN 1 AND 4),
  registration_status TEXT NOT NULL DEFAULT 'auto' CHECK (registration_status IN ('open', 'closed', 'auto')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  send_reminder_24h BOOLEAN DEFAULT TRUE,
  send_reminder_1h BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REGISTRATIONS
-- ============================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  accessibility_requirements TEXT,
  how_heard_about_us TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  attended TEXT CHECK (attended IN ('yes', 'no')),
  check_in_time TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REGISTRATION CHILDREN
-- ============================================
CREATE TABLE registration_children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_age INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DONORS
-- ============================================
CREATE TABLE donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_city TEXT,
  address_postcode TEXT,
  gift_aid_declaration BOOLEAN DEFAULT FALSE,
  gift_aid_declared_at TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DONATIONS
-- ============================================
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES donors(id),
  amount INTEGER NOT NULL, -- in pence
  currency TEXT DEFAULT 'GBP',
  donation_type TEXT NOT NULL CHECK (donation_type IN ('one_time', 'recurring')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  message TEXT,
  campaign TEXT DEFAULT 'general',
  event_id UUID REFERENCES events(id),
  gift_aid_amount INTEGER DEFAULT 0, -- in pence
  fee_amount INTEGER DEFAULT 0, -- in pence
  net_amount INTEGER, -- in pence
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- DONATION SUBSCRIPTIONS (Recurring)
-- ============================================
CREATE TABLE donation_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES donors(id),
  amount INTEGER NOT NULL, -- in pence
  frequency TEXT DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  stripe_subscription_id TEXT,
  next_payment_date DATE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT
);

-- ============================================
-- EMAIL LOGS
-- ============================================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'opened', 'clicked')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- ============================================
-- SCHEDULED EMAILS
-- ============================================
CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_email ON registrations(parent_email);
CREATE INDEX idx_registration_children_registration_id ON registration_children(registration_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_email_logs_event_id ON email_logs(event_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Team members can read their own data
CREATE POLICY "Team members can view own profile" ON team_members
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Team members can view all events
CREATE POLICY "Team members can view all events" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Team members can insert events
CREATE POLICY "Team members can insert events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Team members can update events
CREATE POLICY "Team members can update events" ON events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Public can view published events
CREATE POLICY "Public can view published events" ON events
  FOR SELECT USING (status = 'published');

-- Team members can view all registrations
CREATE POLICY "Team members can view registrations" ON registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Team members can manage registrations
CREATE POLICY "Team members can manage registrations" ON registrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Public can insert registrations
CREATE POLICY "Public can register for events" ON registrations
  FOR INSERT WITH CHECK (true);

-- Team members can view registration children
CREATE POLICY "Team members can view registration children" ON registration_children
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Public can insert registration children
CREATE POLICY "Public can add children to registration" ON registration_children
  FOR INSERT WITH CHECK (true);

-- Team members can view donors
CREATE POLICY "Team members can view donors" ON donors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Public can insert donors
CREATE POLICY "Public can become donors" ON donors
  FOR INSERT WITH CHECK (true);

-- Team members can view donations
CREATE POLICY "Team members can view donations" ON donations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Service role can insert donations (from webhooks)
CREATE POLICY "Service can insert donations" ON donations
  FOR INSERT WITH CHECK (true);

-- Team members can view subscriptions
CREATE POLICY "Team members can view subscriptions" ON donation_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Team members can view email logs
CREATE POLICY "Team members can view email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- Service can insert email logs
CREATE POLICY "Service can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Team members can manage scheduled emails
CREATE POLICY "Team members can manage scheduled emails" ON scheduled_emails
  FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE email = auth.jwt() ->> 'email')
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get registration count for an event
CREATE OR REPLACE FUNCTION get_event_registration_count(event_uuid UUID)
RETURNS TABLE (confirmed_count INTEGER, waitlist_count INTEGER, cancelled_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'confirmed')::INTEGER as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'waitlisted')::INTEGER as waitlist_count,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled_count
  FROM registrations
  WHERE event_id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if event has available slots
CREATE OR REPLACE FUNCTION check_event_availability(event_uuid UUID)
RETURNS TABLE (slots_available INTEGER, waitlist_available INTEGER) AS $$
DECLARE
  event_record RECORD;
  confirmed_count INTEGER;
  waitlist_count INTEGER;
BEGIN
  SELECT total_slots, waitlist_slots INTO event_record FROM events WHERE id = event_uuid;

  SELECT COUNT(*) INTO confirmed_count FROM registrations
  WHERE event_id = event_uuid AND status = 'confirmed';

  SELECT COUNT(*) INTO waitlist_count FROM registrations
  WHERE event_id = event_uuid AND status = 'waitlisted';

  RETURN QUERY SELECT
    GREATEST(0, event_record.total_slots - confirmed_count)::INTEGER as slots_available,
    GREATEST(0, event_record.waitlist_slots - waitlist_count)::INTEGER as waitlist_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT TEAM MEMBERS
-- ============================================
INSERT INTO team_members (email, name, role) VALUES
  ('macram@evolutionimpactinitiative.co.uk', 'M Ramba', 'admin'),
  ('ashley@evolutionimpactinitiative.co.uk', 'A Smith', 'admin'),
  ('blessing@evolutionimpactinitiative.co.uk', 'B Emuchay', 'editor'),
  ('funmi@evolutionimpactinitiative.co.uk', 'F Ayeni', 'editor'),
  ('luke@evolutionimpactinitiative.co.uk', 'L Rogers', 'editor'),
  ('nevien@evolutionimpactinitiative.co.uk', 'N Ramba', 'editor');

-- ============================================
-- STORAGE BUCKET FOR IMAGES
-- ============================================
-- Run this separately in the SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
