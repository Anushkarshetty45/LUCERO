# Daily Email Reminder Setup Guide

This guide explains how to set up automated daily email reminders for LUCERO users.

## Overview

The daily email system sends motivational quotes and progress updates to users who have enabled "Daily Email Reminders" in their settings. The emails are sent at the time each user specifies in their settings.

## Prerequisites

- Supabase project set up
- Email service configured (we'll use Resend or SendGrid)
- Supabase CLI installed

## Setup Steps

### 1. Install Dependencies

First, install a service for sending emails. We recommend Resend for its simplicity:

```bash
npm install resend
```

Or use SendGrid:
```bash
npm install @sendgrid/mail
```

### 2. Set Up Email Service API Key

1. Create an account at [Resend](https://resend.com) or [SendGrid](https://sendgrid.com)
2. Generate an API key
3. Add the API key to your Supabase project secrets:

```bash
# For Supabase Edge Functions
supabase secrets set RESEND_API_KEY=your_api_key_here
# Or for SendGrid
supabase secrets set SENDGRID_API_KEY=your_api_key_here
```

### 3. Create Supabase Edge Function

Create a new Edge Function for sending daily emails:

```bash
supabase functions new send-daily-emails
```

### 4. Edge Function Code

Create the following file at `supabase/functions/send-daily-emails/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get current time in HH:MM format
    const now = new Date()
    const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`

    // Fetch users who have email reminders enabled for this time
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, reminder_time')
      .eq('email_updates', true)

    if (settingsError) throw settingsError

    // Filter users whose reminder time matches current time (within 5 minutes)
    const usersToEmail = settings?.filter(s => {
      const reminderMinutes = parseInt(s.reminder_time.split(':')[0]) * 60 + parseInt(s.reminder_time.split(':')[1])
      const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
      return Math.abs(reminderMinutes - currentMinutes) < 5
    }) || []

    console.log(`Found ${usersToEmail.length} users to email at ${currentTime}`)

    // Send emails to each user
    const emailPromises = usersToEmail.map(async (userSetting) => {
      // Fetch user details
      const { data: userData } = await supabase.auth.admin.getUserById(userSetting.user_id)
      if (!userData.user) return

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userSetting.user_id)
        .single()

      // Fetch user progress
      const progress = await getUserProgress(supabase, userSetting.user_id)

      // Generate email HTML
      const emailHTML = generateDailyEmailHTML(
        profile?.full_name || userData.user.email?.split('@')[0] || 'Student',
        progress
      )

      // Send email using Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'LUCERO <noreply@yourdomain.com>',
          to: userData.user.email,
          subject: `🌟 Your Daily LUCERO Update - ${new Date().toLocaleDateString()}`,
          html: emailHTML
        })
      })

      if (!response.ok) {
        console.error(`Failed to send email to ${userData.user.email}`)
      }

      return response.ok
    })

    await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({ message: `Sent ${usersToEmail.length} emails successfully` }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending daily emails:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to fetch user progress
async function getUserProgress(supabase: any, userId: string) {
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)

  const totalStudyTime = sessions?.reduce((total: number, session: any) => {
    return total + (session.duration || 0)
  }, 0) || 0

  let completedLessons = 0
  if (courses) {
    for (const course of courses) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)

      if (lessons) {
        completedLessons += lessons.filter((l: any) => l.completed).length
      }
    }
  }

  return {
    totalCourses: courses?.length || 0,
    completedLessons,
    totalStudyTime: Math.round(totalStudyTime / 60),
    currentStreak: 0 // Simplified for edge function
  }
}

// Generate email HTML (copy from dailyEmailService.ts)
function generateDailyEmailHTML(userName: string, progress: any): string {
  const quotes = [
    "Every expert was once a beginner. Keep learning!",
    "Success is the sum of small efforts repeated day in and day out.",
    "The secret to getting ahead is getting started.",
    // ... add all quotes here
  ]
  const quote = quotes[Math.floor(Math.random() * quotes.length)]

  return \`<!DOCTYPE html>
<html>
<!-- Copy the full HTML template from dailyEmailService.ts here -->
</html>\`
}
```

### 5. Deploy Edge Function

```bash
supabase functions deploy send-daily-emails
```

### 6. Set Up Cron Job

You have two options:

#### Option A: Use Supabase Cron (Recommended)

Add a cron job to your Supabase project using pg_cron:

```sql
-- Run every hour to check for users
SELECT cron.schedule(
  'send-daily-emails-hourly',
  '0 * * * *', -- Every hour
  $$ SELECT net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/send-daily-emails',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) $$
);
```

#### Option B: Use External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a new cron job
2. Set URL: `https://your-project-ref.supabase.co/functions/v1/send-daily-emails`
3. Add header: `Authorization: Bearer YOUR_ANON_KEY`
4. Set schedule: Every hour (`0 * * * *`)

## Testing

Test the email function manually:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Email Template Customization

The email template is defined in `src/services/dailyEmailService.ts`. You can customize:

- Colors and styling
- Quote collection
- Progress metrics displayed
- Call-to-action button

## Troubleshooting

- **Emails not sending**: Check Resend/SendGrid dashboard for errors
- **Wrong timing**: Ensure user timezone settings are correct
- **Missing progress**: Verify database tables (courses, lessons, study_sessions) exist

## Environment Variables Needed

Add these to your `.env` file for local development:

```env
REACT_APP_URL=http://localhost:3000
```

And these to Supabase secrets:

```bash
RESEND_API_KEY=your_api_key
```

## Notes

- Emails are sent based on UTC time. Consider adding timezone support for more accurate delivery.
- The system checks every hour and sends to users whose reminder time is within 5 minutes of current time.
- Users must have `email_updates` enabled in their settings to receive emails.
