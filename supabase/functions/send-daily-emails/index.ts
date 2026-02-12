import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000'

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
      .select('user_id, reminder_time, timezone')
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
        progress,
        APP_URL
      )

      // Send email using Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'LUCERO <onboarding@resend.dev>', // Change to your domain in production
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

// Generate email HTML
function generateDailyEmailHTML(userName: string, progress: any, appUrl: string): string {
  const quotes = [
    "Every expert was once a beginner. Keep learning!",
    "Success is the sum of small efforts repeated day in and day out.",
    "The secret to getting ahead is getting started.",
    "Don't watch the clock; do what it does. Keep going.",
    "Believe you can and you're halfway there.",
    "Your future self will thank you for the effort you put in today.",
    "Small daily improvements lead to stunning results.",
    "Education is the passport to the future.",
    "The only way to do great work is to love what you do.",
    "Learning is a treasure that will follow its owner everywhere.",
    "You are capable of more than you know. Keep pushing!",
    "Every day is a new opportunity to learn and grow.",
    "The best investment you can make is in yourself.",
    "Knowledge is power. Use it wisely!",
    "Your dedication today shapes your success tomorrow.",
    "Stay focused, stay positive, stay strong!",
    "The journey of a thousand miles begins with a single step.",
    "You don't have to be great to start, but you have to start to be great.",
    "Learning never exhausts the mind.",
    "The more that you read, the more things you will know.",
    "An investment in knowledge pays the best interest.",
    "The expert in anything was once a beginner.",
    "Success doesn't come from what you do occasionally, it comes from what you do consistently.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done.",
    "Wake up with determination. Go to bed with satisfaction."
  ]

  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
  const quote = quotes[dayOfYear % quotes.length]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily LUCERO Update</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
    }
    .content {
      padding: 40px 30px;
    }
    .quote {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 25px;
      border-radius: 12px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .quote-text {
      font-size: 18px;
      font-style: italic;
      color: #333;
      margin: 0;
      line-height: 1.6;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #e9ecef;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .streak-badge {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 15px;
      border-radius: 12px;
      text-align: center;
      margin: 20px 0;
    }
    .streak-badge h3 {
      margin: 0 0 5px 0;
      font-size: 24px;
    }
    .streak-badge p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌟 Good Morning, ${userName}!</h1>
      <p>Your Daily LUCERO Update</p>
    </div>

    <div class="content">
      <h2 style="color: #333; margin-top: 0;">Today's Motivation</h2>
      <div class="quote">
        <p class="quote-text">"${quote}"</p>
      </div>

      <h2 style="color: #333; margin-top: 40px;">Your Progress So Far</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${progress.totalCourses}</div>
          <div class="stat-label">Courses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.completedLessons}</div>
          <div class="stat-label">Lessons Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.totalStudyTime}</div>
          <div class="stat-label">Hours Studied</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.currentStreak}</div>
          <div class="stat-label">Day Streak 🔥</div>
        </div>
      </div>

      ${progress.currentStreak > 0 ? `
      <div class="streak-badge">
        <h3>🔥 ${progress.currentStreak} Day Streak!</h3>
        <p>Keep up the amazing work! You're on fire!</p>
      </div>
      ` : `
      <div class="streak-badge" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
        <h3>Start Your Streak Today! 🚀</h3>
        <p>Begin your learning journey and build momentum!</p>
      </div>
      `}

      <div class="cta">
        <a href="${appUrl}/dashboard" class="btn">
          Continue Learning →
        </a>
      </div>
    </div>

    <div class="footer">
      <p>You're receiving this because you enabled daily email reminders in LUCERO settings.</p>
      <p>© ${new Date().getFullYear()} LUCERO - Your Learning Companion</p>
    </div>
  </div>
</body>
</html>`
}
