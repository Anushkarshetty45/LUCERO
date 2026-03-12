-- UPDATE PROFILE TRIGGER TO HANDLE SUBSCRIPTION PLAN
-- Run this in Supabase SQL Editor AFTER running 08-add-subscription-plans.sql

-- ============================================
-- 1. UPDATE handle_new_user FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_plan TEXT;
BEGIN
  -- Get subscription plan from metadata, default to 'free' if not provided
  v_subscription_plan := COALESCE(NEW.raw_user_meta_data->>'subscription_plan', 'free');

  INSERT INTO profiles (
    id,
    email,
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
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    v_subscription_plan,
    'active',
    NOW(),
    0,
    0,
    NOW()
  );

  -- If user selected Pro plan, log it in subscription history
  IF v_subscription_plan = 'pro' THEN
    INSERT INTO subscription_history (user_id, plan, action)
    VALUES (NEW.id, 'pro', 'upgrade');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE!
-- ============================================
-- New users will now be created with their selected plan
-- Free or Pro subscription is set during registration
