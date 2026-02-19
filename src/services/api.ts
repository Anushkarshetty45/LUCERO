import { supabase } from './supabase'
import { Course, Lesson, Material, LessonProgress, Profile, TopicChat, TopicChatMessage, CourseFlashcard } from '../types'

// ==================== PROFILE ====================
export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== COURSES ====================
export const getCourses = async (userId: string): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getCourse = async (courseId: string): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (error) throw error
  return data
}

export const createCourse = async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCourse = async (courseId: string, updates: Partial<Course>) => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCourse = async (courseId: string) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) throw error
}

// Get course with progress (optimized to reduce queries)
export const getCourseWithProgress = async (courseId: string, userId: string) => {
  try {
    const [course, lessonsResult] = await Promise.all([
      getCourse(courseId),
      supabase.from('lessons').select('id').eq('course_id', courseId)
    ])

    const lessonIds = lessonsResult.data?.map(l => l.id) || []

    // Prefer courses.last_accessed (available after migration 10),
    // otherwise fall back to most recent lesson_progress record
    let lastAccessed: string | null = (course as any).last_accessed || null

    if (!lastAccessed && lessonIds.length > 0) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('last_accessed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
        .not('last_accessed', 'is', null)
        .order('last_accessed', { ascending: false })
        .limit(1)
        .maybeSingle()

      lastAccessed = progressData?.last_accessed || null
    }

    return {
      ...course,
      total_lessons: lessonIds.length,
      last_accessed: lastAccessed
    }
  } catch (error) {
    console.error('Error in getCourseWithProgress:', error)
    try {
      const course = await getCourse(courseId)
      return { ...course, total_lessons: 0, last_accessed: null }
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError)
      throw fallbackError
    }
  }
}

// ==================== LESSONS ====================
export const getLessons = async (courseId: string): Promise<Lesson[]> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
  // .order('order_index', { ascending: true })

  if (error) throw error
  // Sort by created_at as fallback since order_index might not exist
  return (data || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export const getLesson = async (lessonId: string): Promise<Lesson> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (error) throw error
  return data
}

export const createLesson = async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert([lesson])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateLesson = async (lessonId: string, updates: Partial<Lesson>) => {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteLesson = async (lessonId: string) => {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) throw error
}

// ==================== MATERIALS ====================
export const getMaterials = async (lessonId: string): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const uploadMaterial = async (
  lessonId: string,
  file: File,
  title: string
): Promise<Material> => {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Not authenticated')

  // Upload file to storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('materials')
    .getPublicUrl(fileName)

  // Determine file type
  let fileType: 'pdf' | 'video' | 'image' | 'audio' = 'pdf'
  if (file.type.startsWith('video/')) fileType = 'video'
  else if (file.type.startsWith('image/')) fileType = 'image'
  else if (file.type.startsWith('audio/')) fileType = 'audio'

  // Create material record
  const { data, error } = await supabase
    .from('materials')
    .insert([{
      lesson_id: lessonId,
      title,
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size: file.size
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteMaterial = async (materialId: string) => {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)

  if (error) throw error
}

// ==================== PROGRESS ====================
export const getLessonProgress = async (userId: string, lessonId: string): Promise<LessonProgress | null> => {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

export const updateLessonProgress = async (
  userId: string,
  lessonId: string,
  progress: Partial<LessonProgress>
) => {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      ...progress,
      last_accessed: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Record course activity for streak if lesson is completed
  if (progress.completed || progress.progress_percentage === 100) {
    await recordDailyActivity(userId, 'course')
  }

  return data
}

// ==================== STUDY SESSIONS ====================
export const startStudySession = async (userId: string, courseId?: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert([{
      user_id: userId,
      course_id: courseId || null,
      started_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const endStudySession = async (sessionId: string, duration: number, userId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      duration,
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error

  // Record study session activity for streak (only if session was at least 5 minutes)
  if (duration >= 300) {
    await recordDailyActivity(userId, 'study_session')
  }

  return data
}

export const getTodayStudyTime = async (userId: string): Promise<number> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('study_sessions')
    .select('started_at, ended_at')
    .eq('user_id', userId)
    .gte('started_at', today.toISOString())
    .not('ended_at', 'is', null)

  if (error) throw error

  // Calculate duration from timestamps
  const totalSeconds = data?.reduce((sum, session) => {
    if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at).getTime()
      const end = new Date(session.ended_at).getTime()
      const duration = Math.floor((end - start) / 1000) // Convert to seconds
      return sum + duration
    }
    return sum
  }, 0) || 0

  return totalSeconds
}

export const getWeeklyStudyTime = async (userId: string): Promise<number> => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('study_sessions')
    .select('started_at, ended_at')
    .eq('user_id', userId)
    .gte('started_at', weekAgo.toISOString())
    .not('ended_at', 'is', null)

  if (error) throw error

  // Calculate duration from timestamps
  const totalSeconds = data?.reduce((sum, session) => {
    if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at).getTime()
      const end = new Date(session.ended_at).getTime()
      const duration = Math.floor((end - start) / 1000) // Convert to seconds
      return sum + duration
    }
    return sum
  }, 0) || 0

  return totalSeconds
}

export const calculateUserStreak = async (userId: string): Promise<number> => {
  // Get all study sessions with timestamps
  const { data, error } = await supabase
    .from('study_sessions')
    .select('started_at, ended_at')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  console.log('🔍 Study sessions data:', data)

  if (error) throw error
  if (!data || data.length === 0) {
    console.log('✅ No study sessions found, streak = 0')
    return 0
  }

  // Group sessions by date and calculate total study time per day
  const dailyStudyTime: { [date: string]: number } = {}

  data.forEach(session => {
    if (session.started_at && session.ended_at) {
      const date = new Date(session.started_at)
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

      // Calculate duration from timestamps
      const start = new Date(session.started_at).getTime()
      const end = new Date(session.ended_at).getTime()
      const duration = Math.floor((end - start) / 1000) // Convert to seconds

      if (!dailyStudyTime[dateStr]) {
        dailyStudyTime[dateStr] = 0
      }
      dailyStudyTime[dateStr] += duration
    }
  })

  // Filter days with at least 30 minutes (1800 seconds) of study time
  const qualifiedDates = Object.keys(dailyStudyTime)
    .filter(date => dailyStudyTime[date] >= 1800) // 30 minutes = 1800 seconds
    .sort((a, b) => b.localeCompare(a)) // Sort descending (most recent first)

  if (qualifiedDates.length === 0) return 0

  // Check if there's activity today or yesterday (streak might still be valid)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const mostRecentDate = qualifiedDates[0]

  // If most recent activity is not today or yesterday, streak is broken
  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    return 0
  }

  // Count consecutive days
  let streak = 1
  let currentDate = new Date(mostRecentDate)

  for (let i = 1; i < qualifiedDates.length; i++) {
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - 1)
    const expectedDateStr = expectedDate.toISOString().split('T')[0]

    if (qualifiedDates[i] === expectedDateStr) {
      streak++
      currentDate = expectedDate
    } else {
      // Gap found, streak ends
      break
    }
  }

  return streak
}

// ==================== STREAK TRACKING ====================

/**
 * Records daily activity and updates streak
 * @param userId - User ID
 * @param activityType - Type of activity: 'login', 'flashcard', 'quiz', 'study_session'
 */
export const recordDailyActivity = async (userId: string, activityType: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    // Check if activity already recorded today
    const { data: existingActivity } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existingActivity) {
      // Update existing activity - add new activity type if not already present
      const activityTypes = existingActivity.activity_types || []
      if (!activityTypes.includes(activityType)) {
        activityTypes.push(activityType)
        await supabase
          .from('daily_activities')
          .update({
            activity_types: activityTypes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingActivity.id)
      }
    } else {
      // Create new activity record for today
      await supabase
        .from('daily_activities')
        .insert({
          user_id: userId,
          date: today,
          activity_types: [activityType],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // Update streak in user_settings
    await updateUserStreak(userId)
  } catch (error) {
    console.error('Error recording daily activity:', error)
  }
}

/**
 * Updates user's current streak based on daily activities
 */
export const updateUserStreak = async (userId: string): Promise<number> => {
  try {
    // Get all daily activities
    const { data: activities, error } = await supabase
      .from('daily_activities')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    if (!activities || activities.length === 0) {
      // No activities, reset streak
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          current_streak: 0,
          last_active_date: null
        })
      return 0
    }

    // Calculate streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const mostRecentDate = activities[0].date

    // If most recent activity is not today or yesterday, streak is broken
    if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          current_streak: 0,
          last_active_date: mostRecentDate
        })
      return 0
    }

    // Count consecutive days
    let streak = 1
    let currentDate = new Date(mostRecentDate)

    for (let i = 1; i < activities.length; i++) {
      const expectedDate = new Date(currentDate)
      expectedDate.setDate(expectedDate.getDate() - 1)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]

      if (activities[i].date === expectedDateStr) {
        streak++
        currentDate = expectedDate
      } else {
        // Gap found, streak ends
        break
      }
    }

    // Get current longest streak
    const { data: settings } = await supabase
      .from('user_settings')
      .select('longest_streak')
      .eq('user_id', userId)
      .single()

    const longestStreak = Math.max(streak, settings?.longest_streak || 0)

    // Update user_settings
    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        current_streak: streak,
        longest_streak: longestStreak,
        last_active_date: mostRecentDate
      })

    return streak
  } catch (error) {
    console.error('Error updating user streak:', error)
    return 0
  }
}

/**
 * Gets user's current streak from user_settings
 */
export const getUserStreak = async (userId: string): Promise<{ current: number; longest: number }> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return { current: 0, longest: 0 }
    }

    return {
      current: data.current_streak || 0,
      longest: data.longest_streak || 0
    }
  } catch (error) {
    console.error('Error getting user streak:', error)
    return { current: 0, longest: 0 }
  }
}

/**
 * Updates the last accessed timestamp for a course.
 * Writes to lesson_progress (always works) and also to courses.last_accessed
 * (works after running migration 10-add-last-accessed-to-courses.sql).
 */
export const updateCourseAccess = async (userId: string, courseId: string) => {
  try {
    const now = new Date().toISOString()

    // Get the first lesson to anchor the lesson_progress record
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (lessons && lessons.length > 0) {
      // Upsert into lesson_progress — works without any migration
      await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessons[0].id,
          last_accessed: now,
          completed: false,
          progress_percentage: 0
        }, { onConflict: 'user_id,lesson_id' })
    }

    // Also update courses.last_accessed if the column exists (migration 10)
    await supabase
      .from('courses')
      .update({ last_accessed: now })
      .eq('id', courseId)
      .eq('user_id', userId)
  } catch (error) {
    console.error('Error updating course access:', error)
  }
}

// ==================== USER NOTES ====================
export const getAllUserNotes = async (userId: string, courseId: string) => {
  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const getUserNote = async (noteId: string) => {
  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('id', noteId)
    .single()

  if (error) throw error
  return data
}

export const createUserNote = async (userId: string, courseId: string, topic: string, content: string) => {
  const { data, error } = await supabase
    .from('user_notes')
    .insert([{ user_id: userId, course_id: courseId, topic, content }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUserNote = async (noteId: string, content: string) => {
  const { data, error } = await supabase
    .from('user_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteUserNote = async (noteId: string) => {
  const { error } = await supabase
    .from('user_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw error
}

// ==================== FOCUS TRACKING ====================
export const createFocusEvent = async (
  sessionId: string,
  userId: string,
  eventType: 'face_detected' | 'face_lost' | 'looking_away' | 'resumed_focus',
  confidence?: number,
  metadata?: any
) => {
  const { data, error } = await supabase
    .from('focus_events')
    .insert([{
      session_id: sessionId,
      user_id: userId,
      event_type: eventType,
      confidence,
      metadata,
      timestamp: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getFocusEvents = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('focus_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  if (error) throw error
  return data || []
}

// ==================== SESSION ANALYTICS ====================
export const createSessionAnalytics = async (
  sessionId: string,
  userId: string,
  analytics: {
    focusScore: number
    totalFocusedTime: number
    totalDistractedTime: number
    distractionCount: number
    longestFocusStreak: number
    averageFocusStreak: number
    focusTimeline: any[]
    insights?: any
  }
) => {
  const { data, error } = await supabase
    .from('session_analytics')
    .insert([{
      session_id: sessionId,
      user_id: userId,
      focus_score: analytics.focusScore,
      total_focused_time: analytics.totalFocusedTime,
      total_distracted_time: analytics.totalDistractedTime,
      distraction_count: analytics.distractionCount,
      longest_focus_streak: analytics.longestFocusStreak,
      average_focus_streak: analytics.averageFocusStreak,
      focus_timeline: analytics.focusTimeline,
      insights: analytics.insights || null
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getSessionAnalytics = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('session_analytics')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const getUserSessionAnalytics = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('session_analytics')
    .select('*, study_sessions(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// ==================== ACHIEVEMENTS ====================
export const getAllAchievements = async () => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('points', { ascending: false })

  if (error) throw error
  return data || []
}

export const getUserAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const unlockAchievement = async (
  userId: string,
  achievementId: string,
  metadata?: any
) => {
  const { data, error} = await supabase
    .from('user_achievements')
    .insert([{
      user_id: userId,
      achievement_id: achievementId,
      metadata
    }])
    .select('*, achievements(*)')
    .single()

  if (error) {
    // Ignore duplicate key errors (already unlocked)
    if (error.code === '23505') return null
    throw error
  }
  return data
}

export const checkAndUnlockAchievements = async (
  userId: string,
  sessionData: {
    focusScore: number
    focusStreak: number
    duration: number
    distractionCount: number
    studyStreak?: number
    startHour?: number
  }
) => {
  const unlockedAchievements = []

  // Get all achievements
  const achievements = await getAllAchievements()

  // Check each achievement
  for (const achievement of achievements) {
    const criteria = achievement.criteria as any

    let meetsСriteria = false

    // Check different criteria types
    if (criteria.focusStreak && sessionData.focusStreak >= criteria.focusStreak) {
      meetsСriteria = true
    }
    if (criteria.focusScore && sessionData.focusScore >= criteria.focusScore) {
      meetsСriteria = true
    }
    if (criteria.studyStreak && sessionData.studyStreak && sessionData.studyStreak >= criteria.studyStreak) {
      meetsСriteria = true
    }
    if (criteria.hourBefore && sessionData.startHour && sessionData.startHour < criteria.hourBefore) {
      meetsСriteria = true
    }
    if (criteria.hourAfter && sessionData.startHour && sessionData.startHour >= criteria.hourAfter) {
      meetsСriteria = true
    }
    if (criteria.distractionCount !== undefined && sessionData.distractionCount <= criteria.distractionCount) {
      if (criteria.minDuration && sessionData.duration >= criteria.minDuration) {
        meetsСriteria = true
      } else if (!criteria.minDuration) {
        meetsСriteria = true
      }
    }

    if (meetsСriteria) {
      const unlocked = await unlockAchievement(userId, achievement.id, { sessionData })
      if (unlocked) {
        unlockedAchievements.push(unlocked)
      }
    }
  }

  return unlockedAchievements
}

// ==================== DAILY STATISTICS ====================
export const getDailyStats = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const getWeeklyStats = async (userId: string) => {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

export const getMonthlyStats = async (userId: string) => {
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', monthAgo.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

export const updateDailyStats = async (
  userId: string,
  date: string,
  stats: {
    totalStudyTime?: number
    totalFocusTime?: number
    averageFocusScore?: number
    bestFocusStreak?: number
    sessionsCount?: number
    distractionsCount?: number
    achievementsEarned?: number
  }
) => {
  const { data, error } = await supabase
    .from('daily_stats')
    .upsert({
      user_id: userId,
      date,
      ...stats,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ==================== TOPIC CHATS ====================
export const getTopicChats = async (userId: string, courseId: string): Promise<TopicChat[]> => {
  const { data, error } = await supabase
    .from('topic_chats')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const getTopicChat = async (chatId: string): Promise<TopicChat> => {
  const { data, error } = await supabase
    .from('topic_chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error) throw error
  return data
}

export const createTopicChat = async (
  userId: string,
  courseId: string,
  topicName: string,
  topicContext?: string
): Promise<TopicChat> => {
  const { data, error } = await supabase
    .from('topic_chats')
    .insert([{
      user_id: userId,
      course_id: courseId,
      topic_name: topicName,
      topic_context: topicContext || null
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTopicChat = async (
  chatId: string,
  updates: Partial<TopicChat>
): Promise<TopicChat> => {
  const { data, error } = await supabase
    .from('topic_chats')
    .update(updates)
    .eq('id', chatId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteTopicChat = async (chatId: string): Promise<void> => {
  const { error } = await supabase
    .from('topic_chats')
    .delete()
    .eq('id', chatId)

  if (error) throw error
}

// ==================== TOPIC CHAT MESSAGES ====================
export const getChatMessages = async (chatId: string): Promise<TopicChatMessage[]> => {
  const { data, error } = await supabase
    .from('topic_chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true })

  if (error) throw error
  return data || []
}

export const createChatMessage = async (
  chatId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, any>
): Promise<TopicChatMessage> => {
  const { data, error } = await supabase
    .from('topic_chat_messages')
    .insert([{
      chat_id: chatId,
      user_id: userId,
      role,
      content,
      metadata: metadata || null,
      timestamp: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteChatMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('topic_chat_messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error
}

// ==================== GROUP STUDY SESSIONS ====================

export interface StudySession {
  id: string
  host_user_id: string
  meeting_code: string
  room_name: string
  title: string | null
  created_at: string
  started_at: string | null
  ended_at: string | null
  is_active: boolean
  max_participants: number
}

export interface StudySessionParticipant {
  id: string
  session_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  is_currently_in_session: boolean
}

export const createStudySession = async (
  userId: string,
  title?: string
): Promise<{ session: StudySession; meetingCode: string }> => {
  try {
    // Generate meeting code using database function
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_meeting_code')

    if (codeError) throw codeError

    const meetingCode = codeData as string
    const roomName = `lucero-study-${meetingCode.toLowerCase()}-${Date.now()}`

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('group_study_sessions')
      .insert({
        host_user_id: userId,
        meeting_code: meetingCode,
        room_name: roomName,
        title: title || 'Group Study Session',
        started_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Add host as participant
    await joinStudySession(session.id, userId)

    return { session, meetingCode }
  } catch (error) {
    console.error('Error creating study session:', error)
    throw error
  }
}

export const joinStudySession = async (
  sessionId: string,
  userId: string
): Promise<StudySessionParticipant> => {
  try {
    const { data, error } = await supabase
      .from('group_study_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        is_currently_in_session: true
      })
      .select()
      .single()

    if (error) {
      // If already joined, just update the status
      if (error.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('group_study_participants')
          .update({
            is_currently_in_session: true,
            joined_at: new Date().toISOString(),
            left_at: null
          })
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) throw updateError
        return updated
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error joining study session:', error)
    throw error
  }
}

export const getStudySessionByCode = async (
  meetingCode: string
): Promise<StudySession | null> => {
  try {
    const { data, error } = await supabase
      .from('group_study_sessions')
      .select('*')
      .eq('meeting_code', meetingCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting study session by code:', error)
    throw error
  }
}

export const getActiveStudySessions = async (
  userId: string
): Promise<StudySession[]> => {
  try {
    const { data, error } = await supabase
      .from('group_study_sessions')
      .select('*')
      .eq('host_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting active study sessions:', error)
    return []
  }
}

export const getSessionParticipants = async (
  sessionId: string
): Promise<StudySessionParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('group_study_participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_currently_in_session', true)
      .order('joined_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting session participants:', error)
    return []
  }
}

export const leaveStudySession = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('group_study_participants')
      .update({
        is_currently_in_session: false,
        left_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Error leaving study session:', error)
    throw error
  }
}

export const endStudySessionByHost = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  try {
    // Verify user is the host
    const { data: session, error: sessionError } = await supabase
      .from('group_study_sessions')
      .select('host_user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError
    if (session.host_user_id !== userId) {
      throw new Error('Only the host can end the session')
    }

    // End the session
    const { error } = await supabase
      .from('group_study_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error

    // Mark all participants as left
    await supabase
      .from('group_study_participants')
      .update({
        is_currently_in_session: false,
        left_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('is_currently_in_session', true)
  } catch (error) {
    console.error('Error ending study session:', error)
    throw error
  }
}
// ==================== FLASHCARDS ====================
export const saveFlashcards = async (userId: string, courseId: string, flashcards: Array<{ question: string; answer: string; category: string }>) => {
  const flashcardsWithMeta = flashcards.map(card => ({
    user_id: userId,
    course_id: courseId,
    question: card.question,
    answer: card.answer,
    category: card.category
  }))

  const { data, error } = await supabase
    .from('pdf_flashcards')
    .insert(flashcardsWithMeta)
    .select()

  if (error) throw error
  return data
}

export const getCourseFlashcards = async (userId: string, courseId: string): Promise<CourseFlashcard[]> => {
  const { data, error } = await supabase
    .from('pdf_flashcards')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const deleteFlashcardsForCourse = async (userId: string, courseId: string) => {
  const { error } = await supabase
    .from('pdf_flashcards')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (error) throw error
}
