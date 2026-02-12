-- Update all existing users to use 12 PM IST (06:30 UTC) as default reminder time
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new

UPDATE user_settings
SET reminder_time = '06:30'
WHERE reminder_time IS NULL OR reminder_time = '09:00' OR reminder_time = '17:35' OR reminder_time = '17:39' OR reminder_time = '17:40' OR reminder_time = '17:41';

-- Verify the update
SELECT user_id, email_updates, reminder_time, updated_at
FROM user_settings;
