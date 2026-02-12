# Debug Email System

## Current UTC Time
Run this to see current UTC time:
```bash
date -u +"%H:%M"
```

## Check Your Settings in Database

Go to Supabase and run this SQL to see your current settings:

https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new

```sql
SELECT
  user_id,
  email_updates,
  reminder_time,
  created_at,
  updated_at
FROM user_settings;
```

This will show you:
- Do you have any settings saved?
- Is email_updates set to TRUE?
- What is your reminder_time?

## Check Which Users Should Get Emails

Run this SQL to see which users match the current time:

```sql
SELECT
  us.user_id,
  us.email_updates,
  us.reminder_time,
  EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') * 60 + EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'UTC') as current_minutes,
  CAST(SPLIT_PART(us.reminder_time, ':', 1) AS INTEGER) * 60 + CAST(SPLIT_PART(us.reminder_time, ':', 2) AS INTEGER) as reminder_minutes,
  ABS(
    (CAST(SPLIT_PART(us.reminder_time, ':', 1) AS INTEGER) * 60 + CAST(SPLIT_PART(us.reminder_time, ':', 2) AS INTEGER)) -
    (EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') * 60 + EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'UTC'))
  ) as time_difference_minutes
FROM user_settings us
WHERE email_updates = true;
```

This shows you the time difference. If `time_difference_minutes` is less than 5, the email should be sent!

## Check Function Logs

View detailed logs here:
https://app.supabase.com/project/pbszvegbxiczcfdpzatn/functions/send-daily-emails/logs

Look for:
- "Found X users to email" message
- Any error messages
- Resend API responses

## Quick Test with Exact Current Time

1. Get current UTC time: `date -u +"%H:%M"`
2. Go to Settings in your app
3. Set reminder time to EXACTLY what the command shows
4. Enable "Daily Email Reminders"
5. Wait 10 seconds for settings to save
6. Run: `curl -X POST https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU" -H "Content-Type: application/json"`

## Resend Email Verification

For Resend FREE accounts:
1. Go to: https://resend.com/domains
2. Click "Add Domain" or use "Verified Emails"
3. Add your email address
4. Verify it via the link sent to your email

You can ONLY send to verified emails on the free plan!

## Test Resend API Key Directly

Test if your Resend API key works:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>"
  }'
```

Replace:
- `YOUR_RESEND_API_KEY` with your actual Resend API key
- `your-email@example.com` with your email

If this fails, your API key is wrong or not set up correctly.
