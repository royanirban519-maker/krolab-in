/*
# KROLAB Admin Control Room — Phase 4

## Security fixes
1. Revokes all grants from `anon` on every table — the marketplace requires sign-in.
2. Narrows `profiles` UPDATE to user-editable columns only; `role`, `pro_expires_at`
   become admin-only (column-level privilege). Closes the self-promotion hole where
   any signed-in user could SET role='admin' through the data API.
3. Adds `admin_audit_log` to record every privileged admin action.

## Admin functions (SECURITY DEFINER)
- `approve_upi_verification(p_id uuid)` — sets a UTR pending->approved, grants the
  matching Pro tier on the brand's profile, sets pro_expires_at, writes audit log.
- `reject_upi_verification(p_id uuid, p_reason text)` — sets pending->rejected + audit.
- `set_brand_role(p_user_id uuid, p_role text)` — admin-only role reassignment + audit.

All three authorize the CALLER via auth.uid() against the admin role check; they
never trust a caller-supplied actor field. search_path is pinned to public.
*/

-- ── 1. Revoke anon access on every existing table ──────────────────
REVOKE SELECT, INSERT, UPDATE, DELETE ON profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON creator_portfolios FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON upi_verifications FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON collaboration_invites FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON creator_shortlists FROM anon;

-- ── 2. Narrow profiles UPDATE to user-editable columns only ─────────
-- The role, pro_expires_at columns are admin-controlled. A row policy alone
-- cannot restrict columns, so we revoke table-wide UPDATE and re-grant a
-- column list. The existing update_own_profile policy still gates the rows.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, venue_name, pincode, phone) ON profiles TO authenticated;

-- ── 3. Admin can read every upi_verifications row + update status ────
-- A separate admin-scoped policy complements the existing owner-select policy.
-- Note: UPDATE is granted via the SECURITY DEFINER functions, not to the role,
-- so a brand cannot mutate its own verification status.
DROP POLICY IF EXISTS "select_all_upi_admin" ON upi_verifications;
CREATE POLICY "select_all_upi_admin" ON upi_verifications FOR SELECT
  TO authenticated USING (
    auth.uid() = brand_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. Admin can read every profile row (for the upgrade panel) ─────
DROP POLICY IF EXISTS "select_all_profiles_admin" ON profiles;
CREATE POLICY "select_all_profiles_admin" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. admin_audit_log table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('approve_utr','reject_utr','upgrade_brand','downgrade_brand')),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_table text,
  target_id uuid,
  detail jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE DELETE, INSERT, SELECT, UPDATE ON admin_audit_log FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON admin_audit_log FROM authenticated;
GRANT SELECT ON admin_audit_log TO authenticated;

DROP POLICY IF EXISTS "select_audit_log_admin" ON admin_audit_log;
CREATE POLICY "select_audit_log_admin" ON admin_audit_log FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_log(created_at DESC);

-- ── 6. Helper: is the caller an admin? ─────────────────────────────
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ── 7. approve_upi_verification ─────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_upi_verification(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_plan text;
  v_amount int;
  v_expires timestamptz;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Missing verification id';
  END IF;

  -- Authorize the CALLER. Never a parameter.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT brand_id, plan_tier, amount
    INTO v_brand_id, v_plan, v_amount
    FROM upi_verifications
    WHERE id = p_id AND status = 'pending';

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Verification not found or already processed';
  END IF;

  v_expires := CASE v_plan
    WHEN 'Pro Weekly Pass'  THEN now() + interval '7 days'
    WHEN 'Pro Monthly Pass' THEN now() + interval '30 days'
    ELSE now() + interval '7 days'
  END;

  UPDATE upi_verifications
    SET status = 'approved'
    WHERE id = p_id;

  UPDATE profiles
    SET role = 'pro_brand', pro_expires_at = v_expires
    WHERE id = v_brand_id;

  INSERT INTO admin_audit_log (admin_id, action, target_user_id, target_table, target_id, detail)
    VALUES (auth.uid(), 'approve_utr', v_brand_id, 'upi_verifications', p_id,
            jsonb_build_object('plan', v_plan, 'amount', v_amount, 'expires', v_expires));
END;
$$;
REVOKE EXECUTE ON FUNCTION approve_upi_verification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_upi_verification(uuid) TO authenticated;

-- ── 8. reject_upi_verification ──────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_upi_verification(p_id uuid, p_reason text DEFAULT 'Invalid UTR')
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Missing verification id';
  END IF;
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT brand_id INTO v_brand_id
    FROM upi_verifications
    WHERE id = p_id AND status = 'pending';

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Verification not found or already processed';
  END IF;

  UPDATE upi_verifications SET status = 'rejected' WHERE id = p_id;

  INSERT INTO admin_audit_log (admin_id, action, target_user_id, target_table, target_id, detail)
    VALUES (auth.uid(), 'reject_utr', v_brand_id, 'upi_verifications', p_id,
            jsonb_build_object('reason', p_reason));
END;
$$;
REVOKE EXECUTE ON FUNCTION reject_upi_verification(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reject_upi_verification(uuid, text) TO authenticated;

-- ── 9. set_brand_role ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_brand_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'Missing user id'; END IF;
  IF p_role NOT IN ('free_brand','pro_brand','creator','admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  -- Guard against the caller demoting themselves and locking themselves out.
  IF p_user_id = auth.uid() AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'You cannot change your own admin role';
  END IF;

  UPDATE profiles SET role = p_role, pro_expires_at = NULL
    WHERE id = p_user_id;

  v_action := CASE WHEN p_role = 'pro_brand' THEN 'upgrade_brand' ELSE 'downgrade_brand' END;
  INSERT INTO admin_audit_log (admin_id, action, target_user_id, target_table, detail)
    VALUES (auth.uid(), v_action, p_user_id, 'profiles', jsonb_build_object('new_role', p_role));
END;
$$;
REVOKE EXECUTE ON FUNCTION set_brand_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_brand_role(uuid, text) TO authenticated;
