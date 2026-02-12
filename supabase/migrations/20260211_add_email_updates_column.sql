-- Add email_updates column to user_settings table if it doesn't exist

-- Check if the table exists, if not create it
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_updates BOOLEAN DEFAULT true,
  reminder_time TEXT DEFAULT '09:00',
  auto_save_notes BOOLEAN DEFAULT true,
  sound_effects BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  note_font_size TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email_updates column if table exists but column doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'email_updates'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN email_updates BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add reminder_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN reminder_time TEXT DEFAULT '09:00';
  END IF;
END $$;

-- Add auto_save_notes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'auto_save_notes'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN auto_save_notes BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add sound_effects column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'sound_effects'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN sound_effects BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add language column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
END $$;

-- Add timezone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- Add note_font_size column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'note_font_size'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN note_font_size TEXT DEFAULT 'medium';
  END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Create index for email_updates queries
CREATE INDEX IF NOT EXISTS user_settings_email_updates_idx ON user_settings(email_updates) WHERE email_updates = true;

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own settings
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own settings
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own settings
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own settings
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);
