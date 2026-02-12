-- ============================================
-- COPY THIS ENTIRE FILE AND RUN IT IN SUPABASE
-- ============================================
-- Go to: https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new
-- Paste this entire file and click "Run"
-- ============================================

-- Add email_updates column if it doesn't exist
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
    ALTER TABLE user_settings ADD COLUMN reminder_time TEXT DEFAULT '06:30';
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

-- Create indexes
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS user_settings_email_updates_idx ON user_settings(email_updates) WHERE email_updates = true;

-- Success message
SELECT 'Migration completed successfully! All columns added to user_settings table.' AS status;
