import { supabase } from './supabase'
import { getDailyQuote } from './motivationalQuotes'

export interface UserProgress {
  totalCourses: number
  completedLessons: number
  totalStudyTime: number
  currentStreak: number
}

export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    // Fetch user's courses
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)

    // Fetch user's study sessions
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)

    // Calculate total study time (in minutes)
    const totalStudyTime = sessions?.reduce((total, session) => {
      return total + (session.duration || 0)
    }, 0) || 0

    // Calculate completed lessons (lessons with progress)
    let completedLessons = 0
    if (courses) {
      for (const course of courses) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', course.id)

        if (lessons) {
          completedLessons += lessons.filter(l => l.completed).length
        }
      }
    }

    // Calculate current streak
    const currentStreak = await calculateStreak(userId)

    return {
      totalCourses: courses?.length || 0,
      completedLessons,
      totalStudyTime: Math.round(totalStudyTime / 60), // Convert to hours
      currentStreak
    }
  } catch (error) {
    console.error('Error fetching user progress:', error)
    return {
      totalCourses: 0,
      completedLessons: 0,
      totalStudyTime: 0,
      currentStreak: 0
    }
  }
}

async function calculateStreak(userId: string): Promise<number> {
  try {
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!sessions || sessions.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].created_at)
      sessionDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - streak)

      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++
      } else if (sessionDate.getTime() < expectedDate.getTime()) {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}

export function generateDailyEmailHTML(userName: string, progress: UserProgress): string {
  const quote = getDailyQuote()

  return `
<!DOCTYPE html>
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
        <a href="${process.env.REACT_APP_URL || 'http://localhost:3000'}/dashboard" class="btn">
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
</html>
  `
}
