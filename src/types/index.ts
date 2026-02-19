export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  avatar_url: string
  bio?: string
  location?: string
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  subscription_started_at?: string
  subscription_expires_at?: string
  monthly_pdf_uploads: number
  monthly_ai_messages: number
  usage_reset_date: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  user_id: string
  title: string
  description: string
  subject: string
  color: string
  created_at: string
  updated_at: string
  last_accessed?: string | null
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  order_index?: number
  duration?: number
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  lesson_id: string
  title: string
  file_url: string
  file_type: 'pdf' | 'video' | 'image' | 'audio'
  file_size: number
  created_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  progress_percentage: number
  last_accessed: string
  completed_at: string | null
}

export interface StudySession {
  id: string
  user_id: string
  course_id: string | null
  duration: number
  started_at: string
  ended_at: string | null
}

export interface CourseWithProgress extends Course {
  total_lessons: number
  last_accessed: string | null
}

export interface UserNote {
  id: string
  user_id: string
  course_id: string
  topic: string
  content: string
  created_at: string
  updated_at: string
}

export interface TopicChat {
  id: string
  user_id: string
  course_id: string
  topic_name: string
  topic_context: string | null
  created_at: string
  updated_at: string
}

export interface TopicChatMessage {
  id: string
  chat_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface CourseFlashcard {
  id: string
  user_id: string
  course_id: string
  question: string
  answer: string
  category: string
  created_at: string
}