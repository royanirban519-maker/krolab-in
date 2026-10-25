/*
# KROLAB Hospitality Marketplace Schema

## Overview
Creates the core database tables for KROLAB.IN — a Pune hospitality influencer
marketplace. Supports dual-role authentication (brands + creators), creator
portfolio media-kits, UPI payment verification, and collaboration invite tracking.

## New Tables
1. `profiles` — extends Supabase auth.users with role, venue, and Pro status.
2. `creator_portfolios` — full media-kit data for each creator.
3. `upi_verifications` — UTR submission log for Pro plan unlocks.
4. `collaboration_invites` — table shoot invites from brands to creators.
5. `creator_shortlists` — brand heart/saved creator list.

## Security (RLS)
- All tables have RLS enabled.
- Owner-scoped policies using auth.uid() with DEFAULT auth.uid() on owner columns.
- All grants scoped to authenticated role only.
*/

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'free_brand' CHECK (role IN ('free_brand','pro_brand','creator','admin')),
  venue_name text,
  pincode text,
  phone text,
  pro_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, INSERT ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- 2. CREATOR_PORTFOLIOS
CREATE TABLE IF NOT EXISTS creator_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  handle text,
  category text NOT NULL CHECK (category IN ('Restaurants','Cafes','Pubs','Cloud Kitchens')),
  platform text NOT NULL CHECK (platform IN ('instagram','facebook','youtube')),
  gender text,
  pincode text NOT NULL,
  area text,
  followers text,
  avg_views text,
  engagement_rate text,
  base_rate text NOT NULL,
  phone text,
  whatsapp text,
  bio text,
  avatar_url text,
  cover_url text,
  reels_json jsonb DEFAULT '[]'::jsonb,
  photos_json jsonb DEFAULT '[]'::jsonb,
  pincode_density_json jsonb DEFAULT '[]'::jsonb,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE creator_portfolios ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON creator_portfolios TO authenticated;

DROP POLICY IF EXISTS "select_all_portfolios" ON creator_portfolios;
CREATE POLICY "select_all_portfolios" ON creator_portfolios FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_portfolio" ON creator_portfolios;
CREATE POLICY "insert_own_portfolio" ON creator_portfolios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_portfolio" ON creator_portfolios;
CREATE POLICY "update_own_portfolio" ON creator_portfolios FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_portfolio" ON creator_portfolios;
CREATE POLICY "delete_own_portfolio" ON creator_portfolios FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. UPI_VERIFICATIONS
CREATE TABLE IF NOT EXISTS upi_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name text,
  brand_phone text,
  plan_tier text NOT NULL CHECK (plan_tier IN ('Pro Weekly Pass','Pro Monthly Pass')),
  amount integer NOT NULL CHECK (amount IN (599, 1499)),
  utr_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE upi_verifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON upi_verifications TO authenticated;

DROP POLICY IF EXISTS "select_own_upi" ON upi_verifications;
CREATE POLICY "select_own_upi" ON upi_verifications FOR SELECT
  TO authenticated USING (auth.uid() = brand_id);
DROP POLICY IF EXISTS "insert_own_upi" ON upi_verifications;
CREATE POLICY "insert_own_upi" ON upi_verifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = brand_id);

-- 4. COLLABORATION_INVITES
CREATE TABLE IF NOT EXISTS collaboration_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_name text NOT NULL,
  venue_pincode text,
  creator_id text NOT NULL,
  creator_name text NOT NULL,
  package_selected text,
  shoot_date text,
  budget text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON collaboration_invites TO authenticated;

DROP POLICY IF EXISTS "select_own_invites" ON collaboration_invites;
CREATE POLICY "select_own_invites" ON collaboration_invites FOR SELECT
  TO authenticated USING (auth.uid() = brand_id);
DROP POLICY IF EXISTS "insert_own_invites" ON collaboration_invites;
CREATE POLICY "insert_own_invites" ON collaboration_invites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = brand_id);
DROP POLICY IF EXISTS "update_own_invites" ON collaboration_invites;
CREATE POLICY "update_own_invites" ON collaboration_invites FOR UPDATE
  TO authenticated USING (auth.uid() = brand_id) WITH CHECK (auth.uid() = brand_id);

-- 5. CREATOR_SHORTLISTS
CREATE TABLE IF NOT EXISTS creator_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id text NOT NULL,
  creator_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE creator_shortlists ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON creator_shortlists TO authenticated;

DROP POLICY IF EXISTS "select_own_shortlist" ON creator_shortlists;
CREATE POLICY "select_own_shortlist" ON creator_shortlists FOR SELECT
  TO authenticated USING (auth.uid() = brand_id);
DROP POLICY IF EXISTS "insert_own_shortlist" ON creator_shortlists;
CREATE POLICY "insert_own_shortlist" ON creator_shortlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = brand_id);
DROP POLICY IF EXISTS "delete_own_shortlist" ON creator_shortlists;
CREATE POLICY "delete_own_shortlist" ON creator_shortlists FOR DELETE
  TO authenticated USING (auth.uid() = brand_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON creator_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_pincode ON creator_portfolios(pincode);
CREATE INDEX IF NOT EXISTS idx_upi_brand_id ON upi_verifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_invites_brand_id ON collaboration_invites(brand_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_brand_id ON creator_shortlists(brand_id);