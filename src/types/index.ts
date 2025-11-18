export interface Profile {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    avatar_url: string
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
  }
  
  export interface Lesson {
    id: string
    course_id: string
    title: string
    content: string
    order_index: number
    duration: number
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
    completed_lessons: number
    progress_percentage: number
  }