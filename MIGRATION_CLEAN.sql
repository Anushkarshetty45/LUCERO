-- LUCERO Database Migration - Run this in Supabase SQL Editor
-- This adds all missing columns and tables for streak tracking, study time, and settings

-- ============================================================================
-- PART 1: Add missing columns to user_settings table
-- ============================================================================

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_save_notes BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_effects BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS study_reminders BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS note_font_size TEXT DEFAULT 'medium';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_last_active
  ON user_settings(user_id, last_active_date);

-- ============================================================================
-- PART 2: Create daily_activities table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Create index for daily activities
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date
  ON daily_activities(user_id, date DESC);

-- Enable RLS
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Drop and recreate policies (to avoid "already exists" errors)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily activities" ON daily_activities;
DROP POLICY IF EXISTS "Users can insert their own daily activities" ON daily_activities;
DROP POLICY IF EXISTS "Users can update their own daily activities" ON daily_activities;

-- Create fresh policies
CREATE POLICY "Users can view their own daily activities"
  ON daily_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activities"
  ON daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activities"
  ON daily_activities FOR UPDATE
  USING (auth.uid() = user_id);
