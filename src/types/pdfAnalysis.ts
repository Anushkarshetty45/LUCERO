// PDF Analysis Types

export interface PDFAnalysis {
  id: string
  user_id: string
  course_id?: string
  file_name: string
  file_url: string
  file_size?: number
  title: string
  summary: string
  explanation: string
  key_terms: KeyTerm[]
  page_count: number
  analyzed_pages: string
  created_at: string
  updated_at: string
  // Joined data
  course?: {
    title: string
    color: string
  }
}

export interface KeyTerm {
  term: string
  definition: string
  category?: string
}

export interface PDFFlashcard {
  id: string
  pdf_analysis_id: string
  front: string
  back: string
  category: string
  created_at: string
}

export interface PDFQuiz {
  id: string
  pdf_analysis_id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface PDFQuizAttempt {
  id: string
  user_id: string
  pdf_quiz_id: string
  selected_answer: string
  is_correct: boolean
  attempted_at: string
}

export interface PDFChatSession {
  id: string
  pdf_analysis_id: string
  user_id: string
  title: string
  created_at: string
}

export interface PDFChatMessage {
  id: string
  chat_session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface PDFStudyPlan {
  id: string
  pdf_analysis_id: string
  user_id: string
  duration_days: number
  plan_data: StudyPlanData
  created_at: string
}

export interface StudyPlanData {
  days: StudyDay[]
  milestones: string[]
  tips: string[]
}

export interface StudyDay {
  day: number
  date?: string
  topics: string[]
  activities: string[]
  estimated_time: string
  completed?: boolean
}

export interface PDFMindMap {
  id: string
  pdf_analysis_id: string
  map_data: MindMapData
  created_at: string
}

export interface MindMapData {
  central_topic: string
  branches: MindMapBranch[]
}

export interface MindMapBranch {
  topic: string
  subtopics: string[]
}

export interface PDFTranslation {
  id: string
  pdf_analysis_id: string
  language_code: string
  translated_summary: string
  translated_explanation: string
  created_at: string
}

// API Request/Response types
export interface CreatePDFAnalysisRequest {
  userId: string
  courseId?: string
  fileName: string
  fileUrl: string
  fileSize?: number
  title: string
  summary: string
  explanation: string
  keyTerms: KeyTerm[]
  pageCount: number
  analyzedPages: string
}

export interface GenerateFlashcardsResponse {
  flashcards: {
    front: string
    back: string
    category: string
  }[]
}

export interface GenerateQuizResponse {
  questions: {
    question: string
    options: string[]
    correct_answer: string
    explanation: string
    difficulty: string
  }[]
}

export interface GenerateMindMapResponse {
  central_topic: string
  branches: {
    topic: string
    subtopics: string[]
  }[]
}

export interface GenerateStudyPlanResponse {
  days: {
    day: number
    topics: string[]
    activities: string[]
    estimated_time: string
  }[]
  milestones: string[]
  tips: string[]
}
