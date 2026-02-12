# Email Setup Commands - Run These in Your Terminal

## ✅ COMPLETED:
- [x] Supabase CLI installed
- [x] Edge Function folder created
- [x] Edge Function code created

---

## NEXT STEPS - Run these commands:

### Step 1: Get Resend API Key (5 minutes)

1. Open your browser and go to: **https://resend.com**
2. Click "Sign Up" (it's FREE - no credit card needed)
3. After signing in, click "API Keys" in the left sidebar
4. Click "Create API Key"
5. Name it: `LUCERO Daily Emails`
6. Copy the key (starts with `re_...`) and save it somewhere

---

### Step 2: Login to Supabase

Open your terminal in this project folder and run:

```bash
supabase login
```

This will open your browser. Click "Allow" to authorize the CLI.

---

### Step 3: Link Your Supabase Project

```bash
supabase link --project-ref pbszvegbxiczcfdpzatn
```

When asked for the database password, enter your Supabase database password.
(You can find it in your Supabase Dashboard → Settings → Database)

---

### Step 4: Add Your Resend API Key to Supabase

Replace `YOUR_RESEND_API_KEY` with the actual key you got from Step 1:

```bash
supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY
```

Example:
```bash
supabase secrets set RESEND_API_KEY=re_abc123xyz456
```

---

### Step 5: Deploy the Email Function

```bash
supabase functions deploy send-daily-emails
```

After deployment, you'll see a URL like:
`https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails`

---

### Step 6: Test the Function

```bash
curl -X POST https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU" \
  -H "Content-Type: application/json"
```

You should see: `{"message":"Sent X emails successfully"}`

---

### Step 7: Set Up Daily Automation (Choose ONE option)

#### Option A: Supabase Cron (Recommended)

1. Go to: https://app.supabase.com/project/pbszvegbxiczcfdpzatn/database/extensions
2. Enable the "pg_cron" extension
3. Go to: https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new
4. Paste this SQL query and click "Run":

```sql
SELECT cron.schedule(
  'send-daily-emails-hourly',
  '0 * * * *',
  $$ SELECT net.http_post(
      url := 'https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU"}'::jsonb
    ) $$
);
```

#### Option B: External Cron Service (Alternative)

1. Go to: https://cron-job.org and sign up
2. Create a new cron job:
   - **URL**: `https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails`
   - **Schedule**: `0 * * * *` (every hour)
   - **Add HTTP Header**:
     - Name: `Authorization`
     - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU`

---

## ✅ DONE!

Your daily email system is now set up! Here's what happens:

1. Every hour, the system checks which users have "Daily Email Reminders" enabled
2. It sends emails to users whose reminder time matches the current hour
3. Each email includes:
   - A motivational quote (changes daily)
   - User's progress (courses, lessons, study hours, streak)
   - A link to continue learning

---

## Troubleshooting

**"Email not sent"?**
- Make sure at least one user has "Daily Email Reminders" ON in Settings
- Check the user's reminder time matches current UTC time

**"Function deployment failed"?**
- Make sure you're in the LUCERO-1 project directory
- Try running `supabase link` again

**"Invalid API key"?**
- Double-check your Resend API key
- Make sure there are no extra spaces when setting the secret

---

## Check Email Sending Status

To see if emails are being sent, check Supabase Function Logs:
https://app.supabase.com/project/pbszvegbxiczcfdpzatn/functions/send-daily-emails/logs

---

## Important Notes

- The system checks every hour
- Emails are sent based on UTC time
- Users control this feature from Settings → Daily Email Reminders
- Each user can set their preferred reminder time

Need help? Check `QUICK_EMAIL_SETUP.md` or `DAILY_EMAIL_SETUP.md` for more details!
