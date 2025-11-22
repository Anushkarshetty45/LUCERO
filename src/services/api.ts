import { supabase } from './supabase'
import { Course, Lesson, Material, LessonProgress, StudySession, Profile } from '../types'

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

// Get course with progress
export const getCourseWithProgress = async (courseId: string, userId: string) => {
  // Get course
  const course = await getCourse(courseId)
  
  // Get lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
  
  if (lessonsError) throw lessonsError
  
  const lessonIds = lessons?.map(l => l.id) || []
  
  // Get progress
  const { data: progress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
  
  if (progressError) throw progressError
  
  const totalLessons = lessons?.length || 0
  const completedLessons = progress?.filter(p => p.completed).length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  
  return {
    ...course,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    progress_percentage: progressPercentage
  }
}

// ==================== LESSONS ====================
export const getLessons = async (courseId: string): Promise<Lesson[]> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
  
  if (error) throw error
  return data
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