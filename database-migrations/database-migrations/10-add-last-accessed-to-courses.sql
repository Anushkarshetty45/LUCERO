-- Migration: Add last_accessed column to courses table
-- Run this in your Supabase SQL editor

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ DEFAULT NULL;

-- Backfill from lesson_progress for any existing data
UPDATE courses c
SET last_accessed = (
  SELECT MAX(lp.last_accessed)
  FROM lesson_progress lp
  JOIN lessons l ON l.id = lp.lesson_id
  WHERE l.course_id = c.id
)
WHERE EXISTS (
  SELECT 1
  FROM lesson_progress lp
  JOIN lessons l ON l.id = lp.lesson_id
  WHERE l.course_id = c.id
);
