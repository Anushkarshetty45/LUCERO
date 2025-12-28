-- ============================================
-- DIAGNOSTIC SCRIPT
-- Run this to check current database state
-- ============================================

-- Check if profiles table exists
SELECT
  'profiles table' as object_type,
  EXISTS(
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) as exists;

-- Check if trigger exists
SELECT
  'on_auth_user_created trigger' as object_type,
  EXISTS(
    SELECT FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) as exists;

-- Check if function exists
SELECT
  'handle_new_user function' as object_type,
  EXISTS(
    SELECT FROM information_schema.routines
    WHERE routine_name = 'handle_new_user'
  ) as exists;

-- Check RLS policies on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Check profiles table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if there are any existing profiles
SELECT COUNT(*) as profile_count FROM profiles;

-- Check recent auth.users
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
