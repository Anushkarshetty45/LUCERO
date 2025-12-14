import { supabase } from './supabase'
import { Course, Lesson, Material, LessonProgress, Profile } from '../types'

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
    // Parallelize course data and lessons info
    const [course, lessonsResult] = await Promise.all([
      // Get course
      getCourse(courseId),
      // Get lessons with count
      supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
    ])

    const lessonIds = lessonsResult.data?.map(l => l.id) || []

    // Get last accessed date if there are lessons
    let lastAccessed = null
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('last_accessed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
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
    // Fallback: get just the course without progress
    try {
      const course = await getCourse(courseId)
      return {
        ...course,
        total_lessons: 0,
        last_accessed: null
      }
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

export const endStudySession = async (sessionId: string, duration: number) => {
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
  return data
}

export const getTodayStudyTime = async (userId: string): Promise<number> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('study_sessions')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', today.toISOString())

  if (error) throw error

  const totalSeconds = data?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0
  return totalSeconds
}

export const getWeeklyStudyTime = async (userId: string): Promise<number> => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('study_sessions')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', weekAgo.toISOString())

  if (error) throw error

  const totalSeconds = data?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0
  return totalSeconds
}

export const calculateUserStreak = async (userId: string): Promise<number> => {
  // Get all study sessions with duration
  const { data, error } = await supabase
    .from('study_sessions')
    .select('started_at, duration')
    .eq('user_id', userId)
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
    const date = new Date(session.started_at)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    const duration = session.duration || 0

    if (!dailyStudyTime[dateStr]) {
      dailyStudyTime[dateStr] = 0
    }
    dailyStudyTime[dateStr] += duration
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