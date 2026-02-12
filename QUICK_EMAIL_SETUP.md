# Quick Email Setup Guide

Follow these steps to set up daily email reminders for your LUCERO users.

## Part 1: Get an Email Service API Key (5 minutes)

### Option A: Resend (Recommended - Easiest)

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" and create a free account
3. After signing in, click on "API Keys" in the left sidebar
4. Click "Create API Key"
5. Give it a name like "LUCERO Daily Emails"
6. Copy the API key (starts with `re_...`) - **Save this somewhere safe!**

### Option B: SendGrid (Alternative)

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Go to Settings > API Keys
4. Click "Create API Key"
5. Give it a name and select "Full Access"
6. Copy the API key (starts with `SG.`) - **Save this somewhere safe!**

---

## Part 2: Install Supabase CLI (5 minutes)

Open your terminal and run:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref pbszvegbxiczcfdpzatn
```

---

## Part 3: Add API Key to Supabase Secrets (2 minutes)

In your terminal, run ONE of these commands (depending on which service you chose):

```bash
# If you chose Resend:
supabase secrets set RESEND_API_KEY=your_api_key_here

# If you chose SendGrid:
supabase secrets set SENDGRID_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the actual API key you copied in Part 1.

---

## Part 4: Create the Email Sending Function (10 minutes)

### Step 1: Install npm package

In your LUCERO project directory, run:

```bash
npm install resend
# OR if you chose SendGrid:
npm install @sendgrid/mail
```

### Step 2: Create Edge Function

In your terminal, run:

```bash
supabase functions new send-daily-emails
```

This creates a new folder: `supabase/functions/send-daily-emails/`

### Step 3: Add the code

I've already prepared the code template in `DAILY_EMAIL_SETUP.md`. You can either:

**Option A**: Copy the code from DAILY_EMAIL_SETUP.md (lines 56-200) and paste it into:
`supabase/functions/send-daily-emails/index.ts`

**Option B**: I can create this file for you (let me know!)

---

## Part 5: Deploy the Function (2 minutes)

In your terminal, run:

```bash
supabase functions deploy send-daily-emails
```

After deployment, you'll get a URL like:
`https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails`

---

## Part 6: Set Up Daily Automation (5 minutes)

You have two options:

### Option A: Use Supabase Cron (Easiest)

1. Go to your Supabase Dashboard: [https://app.supabase.com/project/pbszvegbxiczcfdpzatn](https://app.supabase.com/project/pbszvegbxiczcfdpzatn)
2. Click on "Database" in the left sidebar
3. Click on "Extensions" tab
4. Find "pg_cron" and enable it
5. Go to "SQL Editor"
6. Paste this SQL query and run it:

```sql
-- This will check every hour for users who need emails
SELECT cron.schedule(
  'send-daily-emails-hourly',
  '0 * * * *', -- Every hour
  $$ SELECT net.http_post(
      url := 'https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU"}'::jsonb
    ) $$
);
```

### Option B: Use External Cron Service (Alternative)

1. Go to [https://cron-job.org](https://cron-job.org) and create a free account
2. Create a new cron job with:
   - **URL**: `https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails`
   - **Schedule**: Every hour (`0 * * * *`)
   - **HTTP Header**:
     - Name: `Authorization`
     - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU`

---

## Part 7: Test It! (2 minutes)

Test the email function manually:

```bash
curl -X POST https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU" \
  -H "Content-Type: application/json"
```

If everything works, you should see:
```json
{"message": "Sent X emails successfully"}
```

And users who have email reminders enabled should receive an email!

---

## Troubleshooting

**No emails sent?**
- Make sure you have at least one user with "Daily Email Reminders" enabled in Settings
- Check that the user's reminder time matches the current UTC time (within 5 minutes)
- Verify your API key is correct in Supabase secrets

**Function deployment failed?**
- Make sure Supabase CLI is properly installed and linked
- Check that you're in the correct project directory
- Try running `supabase link --project-ref pbszvegbxiczcfdpzatn` again

**Need help?**
- Check the full documentation in `DAILY_EMAIL_SETUP.md`
- Verify your Supabase project is active
- Check Supabase Function logs in the dashboard

---

## Quick Checklist

- [ ] Created account with Resend or SendGrid
- [ ] Got API key and saved it
- [ ] Installed Supabase CLI
- [ ] Linked Supabase project
- [ ] Added API key to Supabase secrets
- [ ] Installed npm package (resend or @sendgrid/mail)
- [ ] Created Edge Function with code
- [ ] Deployed Edge Function
- [ ] Set up cron job (Supabase or external)
- [ ] Tested the function
- [ ] Verified email received

---

## What Happens Next?

Once set up:
1. Every hour, the system checks which users have email reminders enabled
2. For users whose reminder time is within the current hour, it sends them:
   - A motivational quote (changes daily)
   - Their progress stats (courses, lessons, study hours, streak)
   - A link back to the app to continue learning
3. Users control this from the Settings page under "Daily Email Reminders"

That's it! Your daily email reminder system is now active!
