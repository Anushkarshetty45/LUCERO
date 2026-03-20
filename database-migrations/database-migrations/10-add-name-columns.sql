-- ADD NAME COLUMNS TO PROFILES TABLE
-- Run this in Supabase SQL Editor BEFORE running the updated migration 09

-- ============================================
-- 1. ADD FIRST NAME AND LAST NAME COLUMNS
-- ============================================

-- Add first_name column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add last_name column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- ============================================
-- 2. UPDATE EXISTING USERS (OPTIONAL)
-- ============================================
-- If you have existing users and want to populate their names from full_name:

-- This splits full_name into first and last name for existing users
UPDATE profiles
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE
    WHEN full_name LIKE '% %' THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- ============================================
-- DONE!
-- ============================================
-- Now you can run the updated migration 09 to fix the trigger
