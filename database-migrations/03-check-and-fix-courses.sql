-- ============================================
-- CHECK AND FIX COURSES TABLE
-- Run this if you're still having foreign key issues
-- ============================================

-- Check if courses table exists
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'courses';

-- Show all foreign keys from courses table
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'courses';

-- Fix courses table foreign key if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'courses'
  ) THEN
    -- Drop existing foreign key if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'courses'
        AND constraint_name = 'courses_user_id_fkey'
    ) THEN
      ALTER TABLE courses DROP CONSTRAINT courses_user_id_fkey;
      RAISE NOTICE 'Dropped existing courses_user_id_fkey constraint';
    END IF;

    -- Add new foreign key with CASCADE
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'courses'
        AND column_name = 'user_id'
    ) THEN
      ALTER TABLE courses
        ADD CONSTRAINT courses_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
      RAISE NOTICE '✅ Added CASCADE deletion to courses table';
    ELSE
      RAISE NOTICE 'No user_id column found in courses table';
    END IF;

  ELSE
    RAISE NOTICE 'Courses table does not exist';
  END IF;
END $$;

-- Show the updated foreign key
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'courses';

SELECT '✅ Courses table check complete' AS status;
