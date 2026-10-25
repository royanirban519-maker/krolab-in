-- Brand Hub fields + Profile Activity & Click Telemetry
-- Adds brand_type, address, venue_images to profiles (nullable, brand-editable)
-- Adds profile_activity table for tracking views/clicks/user activity

-- 1) Extend profiles for the Brand Hub dashboard
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS brand_type text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS venue_images jsonb DEFAULT '[]'::jsonb;

-- Brands may edit their own brand_type / address / venue_images / venue_name / phone / pincode
GRANT UPDATE (brand_type, address, venue_images, venue_name, phone, pincode)
  ON profiles TO authenticated;

-- 2) Profile activity / click telemetry table
CREATE TABLE IF NOT EXISTS profile_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  target_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_name text,
  activity_type text NOT NULL,  -- 'profile_view' | 'contact_click' | 'whatsapp_click' | 'phone_click' | 'login' | 'search' | 'shortlist' | 'invite_sent'
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin-only: RLS so only admins can read the full telemetry log
ALTER TABLE profile_activity ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON profile_activity TO authenticated;
GRANT SELECT ON profile_activity TO authenticated, anon;

-- Anyone authenticated may insert telemetry rows about their own activity (best-effort logging)
CREATE POLICY "insert_activity_self" ON profile_activity FOR INSERT
  TO authenticated WITH CHECK (true);

-- Only admins may read all activity rows
CREATE POLICY "select_activity_admin" ON profile_activity FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Service role (edge functions) full access
GRANT ALL ON profile_activity TO service_role;

-- Helpful index for the admin dashboard
CREATE INDEX IF NOT EXISTS idx_profile_activity_created ON profile_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_activity_target ON profile_activity (target_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_activity_type ON profile_activity (activity_type);
