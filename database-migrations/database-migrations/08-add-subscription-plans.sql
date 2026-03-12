-- ADD SUBSCRIPTION PLANS TO LUCERO
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD SUBSCRIPTION FIELDS TO PROFILES
-- ============================================

-- Add subscription plan column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro'));

-- Add subscription metadata
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired'));

-- Add usage tracking fields for free plan limits
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monthly_pdf_uploads INTEGER DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monthly_ai_messages INTEGER DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 2. CREATE SUBSCRIPTION HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
  action TEXT NOT NULL CHECK (action IN ('upgrade', 'downgrade', 'renew', 'cancel')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ENABLE RLS FOR SUBSCRIPTION HISTORY
-- ============================================

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription history" ON subscription_history;
CREATE POLICY "Users can insert own subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. CREATE FUNCTION TO RESET MONTHLY USAGE
-- ============================================

CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    monthly_pdf_uploads = 0,
    monthly_ai_messages = 0,
    usage_reset_date = NOW()
  WHERE
    subscription_plan = 'free'
    AND usage_reset_date < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE FUNCTION TO CHECK PLAN LIMITS
-- ============================================

CREATE OR REPLACE FUNCTION check_plan_limit(
  p_user_id UUID,
  p_limit_type TEXT  -- 'pdf_upload' or 'ai_message'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_pdf_count INTEGER;
  v_ai_count INTEGER;
BEGIN
  -- Get user's plan and current usage
  SELECT
    subscription_plan,
    monthly_pdf_uploads,
    monthly_ai_messages
  INTO v_plan, v_pdf_count, v_ai_count
  FROM profiles
  WHERE id = p_user_id;

  -- Pro plan has unlimited access
  IF v_plan = 'pro' THEN
    RETURN TRUE;
  END IF;

  -- Free plan limits
  IF p_limit_type = 'pdf_upload' THEN
    RETURN v_pdf_count < 5;
  ELSIF p_limit_type = 'ai_message' THEN
    RETURN v_ai_count < 30;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE FUNCTION TO INCREMENT USAGE
-- ============================================

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type TEXT  -- 'pdf_upload' or 'ai_message'
)
RETURNS void AS $$
BEGIN
  IF p_usage_type = 'pdf_upload' THEN
    UPDATE profiles
    SET monthly_pdf_uploads = monthly_pdf_uploads + 1
    WHERE id = p_user_id;
  ELSIF p_usage_type = 'ai_message' THEN
    UPDATE profiles
    SET monthly_ai_messages = monthly_ai_messages + 1
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. UPDATE EXISTING USERS TO FREE PLAN
-- ============================================

UPDATE profiles
SET
  subscription_plan = 'free',
  subscription_status = 'active',
  subscription_started_at = created_at
WHERE subscription_plan IS NULL;

-- ============================================
-- 9. CREATE INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
  ON profiles(subscription_plan, subscription_status);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user
  ON subscription_history(user_id, created_at DESC);

-- ============================================
-- DONE!
-- ============================================
-- Users can now have 'free' or 'pro' plans
-- Free plan: 5 PDF uploads/month, 30 AI messages/month
-- Pro plan: Unlimited everything
