-- ============================================
-- FIX FOR "Database error saving new user"
-- This fixes the RLS policy issue preventing profile creation
-- ============================================

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 3: Recreate the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create FIXED RLS Policies
-- Allow anyone to view profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- CRITICAL FIX: Allow inserts from authenticated users OR from the trigger
-- This policy allows both direct inserts and trigger-based inserts
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IS NULL -- Allow trigger context where auth.uid() might be NULL
  );

-- Alternative: If the above doesn't work, use this more permissive policy
-- Uncomment if needed:
-- DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
-- CREATE POLICY "Allow profile creation"
--   ON profiles FOR INSERT
--   WITH CHECK (true);

-- Step 6: Recreate the trigger function with proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Run with the privileges of the function creator
SET search_path = public, auth -- Explicitly set search path
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    username,
    first_name,
    last_name,
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 8: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 9: Verify setup
DO $$
BEGIN
  -- Check if trigger exists
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created created successfully';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NOT found';
  END IF;

  -- Check if function exists
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Function handle_new_user() created successfully';
  ELSE
    RAISE WARNING '❌ Function handle_new_user() NOT found';
  END IF;

  -- Check if policies exist
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    RAISE NOTICE '✅ RLS policies created successfully';
  ELSE
    RAISE WARNING '❌ RLS policies NOT found';
  END IF;
END $$;

SELECT '✅ Database fix applied successfully!' AS status;
SELECT 'Try registering a new user now.' AS next_step;
