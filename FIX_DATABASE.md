# Fix Database Error - Add Missing Columns

## The Problem:
The `user_settings` table is missing the `email_updates` column and other settings columns.

## The Solution (Choose ONE method):

---

## Method 1: Use Supabase CLI (Easiest)

Run this command in your terminal:

```bash
supabase db push
```

This will apply the migration file I created: `supabase/migrations/20260211_add_email_updates_column.sql`

---

## Method 2: Run SQL Directly in Supabase Dashboard (Alternative)

1. Go to: https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new

2. Copy the ENTIRE content from: `supabase/migrations/20260211_add_email_updates_column.sql`

3. Paste it into the SQL Editor

4. Click "Run" button

---

## After Running the Migration:

Test the email function again:

```bash
curl -X POST https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU" \
  -H "Content-Type: application/json"
```

You should now see: `{"message":"Sent 0 emails successfully"}`

(It will be 0 because you probably don't have any users with email reminders enabled yet - that's normal!)

---

## What the Migration Does:

- Creates `user_settings` table (if it doesn't exist)
- Adds all necessary columns:
  - `email_updates` (for daily email reminders)
  - `reminder_time` (what time to send emails)
  - `auto_save_notes`
  - `sound_effects`
  - `language`
  - `timezone`
  - `note_font_size`
- Sets up proper security policies
- Creates indexes for better performance

---

## Verify It Worked:

After running the migration, go to:
https://app.supabase.com/project/pbszvegbxiczcfdpzatn/editor

Click on "user_settings" table and you should see all the columns listed above!
