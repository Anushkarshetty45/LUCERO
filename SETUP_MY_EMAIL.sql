-- Automatic Email Setup for Testing
-- Run this entire file in Supabase SQL Editor: https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new

-- Step 1: Check your user account
SELECT
    id as user_id,
    email,
    created_at,
    '👆 This is your user ID - copy it for Step 2' as note
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Enable email reminders for your account
-- IMPORTANT: Replace 'YOUR_USER_ID_FROM_ABOVE' with the actual user_id from Step 1 results

INSERT INTO user_settings (user_id, email_updates, reminder_time, timezone, auto_save_notes, sound_effects, language, note_font_size)
VALUES (
  'YOUR_USER_ID_FROM_ABOVE',  -- ⚠️ REPLACE THIS with your user_id from Step 1!
  true,                        -- Email reminders ON
  '18:04',                     -- Current UTC time (will update this)
  'Asia/Kolkata',              -- IST timezone
  true,                        -- Auto-save notes
  true,                        -- Sound effects
  'en',                        -- English
  'medium'                     -- Font size
)
ON CONFLICT (user_id) DO UPDATE
SET
  email_updates = true,
  reminder_time = '18:04',
  timezone = 'Asia/Kolkata',
  updated_at = NOW();

-- Step 3: Verify settings were saved
SELECT
    user_id,
    email_updates,
    reminder_time,
    timezone,
    '✅ Email reminders are now enabled!' as status
FROM user_settings;

-- Step 4: Check current UTC time vs your reminder time
SELECT
    EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') || ':' || LPAD(EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'UTC')::text, 2, '0') as current_utc_time,
    reminder_time as your_reminder_time,
    CASE
        WHEN reminder_time = EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') || ':' || LPAD(EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'UTC')::text, 2, '0')
        THEN '✅ Times match! Email will send now!'
        ELSE '⚠️ Times don''t match. Update reminder_time to current UTC.'
    END as status
FROM user_settings
WHERE email_updates = true
LIMIT 1;
