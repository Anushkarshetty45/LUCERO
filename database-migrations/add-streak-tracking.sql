-- Add streak tracking columns to user_settings table
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_last_active
  ON user_settings(user_id, last_active_date);

-- Create a table to track daily activities
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_types TEXT[] DEFAULT '{}', -- Array of activity types: login, flashcard, quiz, study_session
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one row per user per day
  UNIQUE(user_id, activity_date)
);

-- Create index for daily activities
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date
  ON daily_activities(user_id, activity_date DESC);

-- Add RLS policies for daily_activities
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily activities"
  ON daily_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily activities"
  ON daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily activities"
  ON daily_activities FOR UPDATE
  USING (auth.uid() = user_id);
