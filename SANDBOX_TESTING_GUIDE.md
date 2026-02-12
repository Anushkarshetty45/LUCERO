# 🧪 Sandbox Testing Guide - Email System

Test your daily email system completely FREE before going to production!

---

## 📋 Testing Plan Overview

We'll test:
1. ✅ Email sending works
2. ✅ Email content looks good (quotes, progress stats)
3. ✅ Links work correctly
4. ✅ Timing system works (12 PM IST)
5. ✅ Multiple users can receive emails

**All using Resend's FREE plan!**

---

## 🚀 Step-by-Step Sandbox Testing

### Step 1: Verify Your Email in Resend (Free Plan)

1. **Go to Resend Dashboard:**
   https://resend.com/emails

2. **Add Your Email for Verification:**
   - Look for "Verified Emails" or "Domain" section
   - Click "Add Email Address"
   - Enter your email (e.g., `youremail@gmail.com`)
   - Click "Send Verification Email"

3. **Check Your Inbox:**
   - Open the verification email from Resend
   - Click the verification link
   - ✅ Your email is now verified!

**On the free plan, you can only send to verified emails. That's perfect for testing!**

---

### Step 2: Update Database to Use Your Verified Email

Go to Supabase SQL Editor:
https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new

Run this SQL to set your email as the test recipient:

```sql
-- First, check what user accounts exist
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Note: Copy your user ID from the results above
-- Then update settings for YOUR user account
INSERT INTO user_settings (user_id, email_updates, reminder_time, timezone)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your actual user ID from above
  true,                 -- Email updates enabled
  '06:30',              -- 12 PM IST = 06:30 UTC
  'Asia/Kolkata'        -- IST timezone
)
ON CONFLICT (user_id) DO UPDATE
SET email_updates = true,
    reminder_time = '06:30',
    timezone = 'Asia/Kolkata';

-- Verify it was saved
SELECT * FROM user_settings;
```

---

### Step 3: Test Email Sending RIGHT NOW

#### A. Check Current UTC Time

```bash
date -u +"%H:%M"
```

Let's say it shows: `18:00`

#### B. Temporarily Set Reminder Time to Current Time

Run this SQL (replace `18:00` with your current UTC time):

```sql
UPDATE user_settings
SET reminder_time = '18:00'  -- Replace with current UTC time
WHERE email_updates = true;
```

#### C. Trigger the Email Function

In your terminal, run:

```bash
curl -X POST https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{"message":"Sent 1 emails successfully"}
```

#### D. Check Your Email! 📧

Open your inbox (the email you verified in Resend). You should see:
- Subject: "🌟 Your Daily LUCERO Update - [Today's Date]"
- From: "LUCERO <onboarding@resend.dev>"
- Beautiful HTML email with:
  - Your name
  - Daily motivational quote
  - Progress stats (courses, lessons, hours, streak)
  - "Continue Learning" button

**SUCCESS!** ✅

#### E. Reset to Production Time (12 PM IST)

After testing, run this SQL:

```sql
UPDATE user_settings
SET reminder_time = '06:30'  -- Back to 12 PM IST
WHERE email_updates = true;
```

---

### Step 4: Test with Multiple Email Addresses

Want to test with friends/family emails?

#### A. Add More Verified Emails in Resend

1. Go to: https://resend.com/emails
2. Add each test email address
3. Verify each one

**Free plan allows multiple verified emails!**

#### B. Create Test User Accounts

In Supabase SQL Editor:

```sql
-- Check existing users
SELECT id, email FROM auth.users;

-- For each test email, add settings
INSERT INTO user_settings (user_id, email_updates, reminder_time, timezone)
VALUES (
  'test_user_id_1',  -- Replace with actual user ID
  true,
  '06:30',
  'Asia/Kolkata'
),
(
  'test_user_id_2',  -- Another test user
  true,
  '06:30',
  'Asia/Kolkata'
);
```

#### C. Trigger and Verify

Run the curl command again. All verified emails should receive the email!

---

### Step 5: Test Email Content Variations

#### Test Different Progress Stats

Update your test user's data to see how emails look:

```sql
-- Create some test courses
INSERT INTO courses (user_id, title, subject, description)
VALUES
  ('YOUR_USER_ID', 'JavaScript Basics', 'Programming', 'Learn JS fundamentals'),
  ('YOUR_USER_ID', 'React Mastery', 'Web Development', 'Advanced React patterns');

-- Create some test study sessions
INSERT INTO study_sessions (user_id, course_id, duration, focus_score)
VALUES
  ('YOUR_USER_ID', 'course_id_1', 3600, 85),  -- 1 hour session
  ('YOUR_USER_ID', 'course_id_2', 7200, 92);  -- 2 hour session
```

Trigger email again and see updated stats!

---

### Step 6: Test the "Continue Learning" Button

When you receive the email:

1. **Click the "Continue Learning →" button**
2. **Should open:** `http://localhost:3000/dashboard`
3. **Verify:** You're logged in and see your dashboard

**For production testing:** Update APP_URL and the link will point to your live site!

---

### Step 7: Test Daily Quote Rotation

The quote changes based on the day of the year. To test different quotes:

**Method 1: Wait for Tomorrow**
- Just wait and trigger again tomorrow
- You'll see a different quote!

**Method 2: Modify Edge Function Temporarily**

Edit `supabase/functions/send-daily-emails/index.ts` and change the quote selection:

```typescript
// Original (line ~170):
const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
const quote = quotes[dayOfYear % quotes.length]

// Change to random for testing:
const quote = quotes[Math.floor(Math.random() * quotes.length)]
```

Redeploy and trigger multiple times to see different quotes!

```bash
supabase functions deploy send-daily-emails
```

---

### Step 8: Test Timezone Handling

Test that the 12 PM IST timing works correctly:

**Your Current Time vs UTC:**

```bash
echo "Your local time: $(date +'%H:%M')"
echo "UTC time: $(date -u +'%H:%M')"
echo "Difference: Your timezone offset"
```

**For 12 PM IST:**
- 12:00 PM IST = 06:30 AM UTC
- The system should send emails when UTC time is 06:30

**Test by:**
1. Setting reminder_time to `06:30`
2. Waiting until 12:00 PM IST (6:30 AM UTC)
3. Triggering the function (or let cron do it automatically)

---

## 🎯 Complete Test Checklist

Run through this checklist:

- [ ] Resend account created
- [ ] Email verified in Resend
- [ ] Supabase Edge Function deployed
- [ ] User settings created in database
- [ ] Email received successfully
- [ ] Email content looks good (HTML formatting)
- [ ] Motivational quote displays correctly
- [ ] Progress stats show correct numbers
- [ ] "Continue Learning" button works
- [ ] Link opens correct URL
- [ ] Multiple verified emails can receive
- [ ] Different quotes rotate
- [ ] Timing works (12 PM IST = 06:30 UTC)

**If all checked ✅ - Your system is production-ready!**

---

## 📊 Monitor Test Results

### Check Supabase Function Logs

View detailed logs:
https://app.supabase.com/project/pbszvegbxiczcfdpzatn/functions/send-daily-emails/logs

Look for:
- "Found X users to email" messages
- Success/failure for each email
- Any error messages

### Check Resend Dashboard

View sent emails:
https://resend.com/emails

You'll see:
- ✅ Successfully delivered emails
- ❌ Failed emails (with reasons)
- 📊 Delivery stats
- 📧 Email previews

---

## 🐛 Troubleshooting Sandbox Issues

### Issue 1: "Sent 0 emails successfully"

**Possible causes:**
- ❌ Reminder time doesn't match current UTC time
- ❌ email_updates is false in database
- ❌ No user_settings record exists

**Solutions:**
```sql
-- Check settings
SELECT * FROM user_settings WHERE email_updates = true;

-- Verify reminder_time matches current UTC
SELECT
  reminder_time,
  EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') || ':' || LPAD(EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'UTC')::text, 2, '0') as current_utc
FROM user_settings
WHERE email_updates = true;
```

---

### Issue 2: Email Not Received

**Possible causes:**
- ❌ Email not verified in Resend
- ❌ Email in spam folder
- ❌ Wrong email address in database

**Solutions:**
1. Check spam/junk folder
2. Verify email in Resend dashboard
3. Check user email in database:
```sql
SELECT u.email, us.email_updates
FROM auth.users u
LEFT JOIN user_settings us ON u.id = us.user_id;
```

---

### Issue 3: Resend API Error

**Error message:** "Invalid API key" or "Forbidden"

**Solution:**
```bash
# Verify API key is set
supabase secrets list

# If not listed, set it again
supabase secrets set RESEND_API_KEY=your_key_here

# Redeploy function
supabase functions deploy send-daily-emails
```

---

### Issue 4: Function Logs Show Errors

**Check logs:**
https://app.supabase.com/project/pbszvegbxiczcfdpzatn/functions/send-daily-emails/logs

**Common errors:**

**"Cannot read property 'email' of undefined"**
→ User doesn't exist in auth.users table

**"column user_settings.email_updates does not exist"**
→ Run RUN_THIS_SQL.sql again to add columns

**"Failed to send email"**
→ Check Resend API key and email verification

---

## 🎓 Advanced Sandbox Tests

### Test A: Simulate Production Load

Create multiple test users and send bulk emails:

```sql
-- Create 10 test users with settings
INSERT INTO user_settings (user_id, email_updates, reminder_time)
SELECT
  gen_random_uuid(),
  true,
  '06:30'
FROM generate_series(1, 10);
```

**Note:** On free plan, you can only send to verified emails, so this tests the function logic, not actual delivery.

---

### Test B: Email Deliverability Test

Use tools to test if emails go to spam:

1. **Mail Tester:** https://www.mail-tester.com
2. Get the test email address
3. Temporarily change your test account email to that address
4. Trigger email
5. Check spam score

**Aim for:** 8/10 or higher

---

### Test C: Mobile Email Preview

Forward the test email to yourself and check on:
- 📱 iPhone Mail app
- 📱 Gmail app (Android/iOS)
- 💻 Gmail web
- 💻 Outlook

Verify:
- ✅ Images load
- ✅ Buttons clickable
- ✅ Formatting looks good
- ✅ Responsive on mobile

---

## ✅ Sandbox Testing Complete!

Once you've tested everything and it works perfectly:

**You're ready for production!** 🚀

Just:
1. Upgrade to Resend Pro ($20/month)
2. Set production APP_URL
3. Deploy your app
4. Users will automatically receive emails!

---

## 📝 Test Results Template

Document your testing:

```
Date: __________
Tester: __________

Email Delivery:
[ ] Email sent successfully
[ ] Email received in inbox
[ ] Not in spam folder

Content:
[ ] Motivational quote displayed
[ ] Progress stats accurate
[ ] Streak count correct
[ ] User name personalized

Functionality:
[ ] "Continue Learning" button works
[ ] Link goes to correct URL
[ ] Mobile responsive
[ ] Looks good in Gmail/Outlook

Performance:
[ ] Email sent in < 5 seconds
[ ] Function logs show no errors
[ ] Resend shows "delivered" status

Issues Found:
___________________________
___________________________

Overall Status: ✅ PASS / ❌ FAIL
```

---

## 🎉 Ready to Test?

**Start with Step 1:** Verify your email in Resend!

Then follow steps 2-8 to test everything.

**Testing time:** ~15-30 minutes for complete validation

**Cost:** $0 (completely free!)

**Confidence:** 100% that your production system will work! ✨
