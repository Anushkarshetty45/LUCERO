-- FIX handle_new_user TRIGGER TO HANDLE ALL EDGE CASES
-- Run this in Supabase SQL Editor to fix registration and Google OAuth issues
-- This migration ensures columns exist and handles NULL values properly

-- ============================================
-- 1. ENSURE REQUIRED COLUMNS EXIST
-- ============================================

-- Add first_name and last_name columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- ============================================
-- 2. DROP EXISTING TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 3. CREATE IMPROVED handle_new_user FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_plan TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_username TEXT;
BEGIN
  -- Extract subscription plan (default to 'free')
  v_subscription_plan := COALESCE(NEW.raw_user_meta_data->>'subscription_plan', 'free');

  -- Extract full name with multiple fallbacks
  -- Google OAuth provides 'full_name' or 'name'
  -- Email registration provides 'full_name'
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',  -- Google OAuth fallback
    SPLIT_PART(NEW.email, '@', 1)     -- Use email username as last resort
  );

  -- Extract first name with fallbacks
  -- Priority: explicit first_name > split full_name > email username
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    SPLIT_PART(v_full_name, ' ', 1),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Extract last name with fallbacks
  -- Priority: explicit last_name > extract from full_name > NULL
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    CASE
      WHEN v_full_name LIKE '% %' THEN
        SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name) + 1)
      ELSE NULL
    END
  );

  -- Generate username (email prefix or from metadata)
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Insert profile with all required fields
  INSERT INTO profiles (
    id,
    username,
    first_name,
    last_name,
    full_name,
    avatar_url,
    subscription_plan,
    subscription_status,
    subscription_started_at,
    monthly_pdf_uploads,
    monthly_ai_messages,
    usage_reset_date
  )
  VALUES (
    NEW.id,
    v_username,
    v_first_name,
    v_last_name,
    v_full_name,
    NEW.raw_user_meta_data->>'avatar_url',  -- Google OAuth provides this
    v_subscription_plan,
    'active',
    NOW(),
    0,
    0,
    NOW()
  );

  -- Log pro plan upgrades to subscription history
  IF v_subscription_plan = 'pro' THEN
    INSERT INTO subscription_history (user_id, plan, action)
    VALUES (NEW.id, 'pro', 'upgrade');
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise for debugging
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. RECREATE TRIGGER
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE!
-- ============================================
-- The trigger now handles:
-- - Email registration with first_name/last_name metadata
-- - Google OAuth with full_name/name/avatar_url metadata
-- - Missing or NULL values with intelligent fallbacks
-- - Proper error logging for debugging
