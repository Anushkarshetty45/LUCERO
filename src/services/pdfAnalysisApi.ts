import { supabase } from './supabase'
import type {
  PDFAnalysis,
  CreatePDFAnalysisRequest,
  PDFFlashcard,
  PDFQuiz,
  PDFQuizAttempt,
  PDFChatSession,
  PDFChatMessage,
  PDFStudyPlan,
  PDFMindMap,
  PDFTranslation,
  StudyPlanData,
  MindMapData
} from '../types/pdfAnalysis'

// ============================================================================
// PDF FILE STORAGE
// ============================================================================

export const uploadPDFToStorage = async (file: File, userId: string): Promise<{ fileName: string; url: string }> => {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `${userId}/${timestamp}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('pdf-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload PDF: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('pdf-files')
    .getPublicUrl(fileName)

  return { fileName, url: publicUrl }
}

export const deletePDFFromStorage = async (fileName: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('pdf-files')
    .remove([fileName])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete PDF: ${error.message}`)
  }
}

// ============================================================================
// PDF ANALYSES
// ============================================================================

export const createPDFAnalysis = async (data: CreatePDFAnalysisRequest): Promise<PDFAnalysis> => {
  const { data: analysis, error } = await supabase
    .from('pdf_analyses')
    .insert({
      user_id: data.userId,
      course_id: data.courseId,
      file_name: data.fileName,
      file_url: data.fileUrl,
      file_size: data.fileSize,
      title: data.title,
      summary: data.summary,
      explanation: data.explanation,
      key_terms: data.keyTerms,
      page_count: data.pageCount,
      analyzed_pages: data.analyzedPages
    })
    .select()
    .single()

  if (error) {
    console.error('Create analysis error:', error)
    throw new Error(`Failed to save PDF analysis: ${error.message}`)
  }

  return analysis
}

export const getPDFAnalysis = async (analysisId: string): Promise<PDFAnalysis> => {
  const { data, error } = await supabase
    .from('pdf_analyses')
    .select('*, courses(title, color)')
    .eq('id', analysisId)
    .single()

  if (error) {
    console.error('Get analysis error:', error)
    throw new Error(`Failed to fetch PDF analysis: ${error.message}`)
  }

  return data
}

export const getUserPDFAnalyses = async (userId: string): Promise<PDFAnalysis[]> => {
  const { data, error } = await supabase
    .from('pdf_analyses')
    .select('*, courses(title, color)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get user analyses error:', error)
    throw new Error(`Failed to fetch PDF analyses: ${error.message}`)
  }

  return data || []
}

export const getCoursePDFAnalyses = async (courseId: string): Promise<PDFAnalysis[]> => {
  const { data, error } = await supabase
    .from('pdf_analyses')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get course analyses error:', error)
    throw new Error(`Failed to fetch course PDF analyses: ${error.message}`)
  }

  return data || []
}

export const updatePDFAnalysis = async (
  analysisId: string,
  updates: Partial<PDFAnalysis>
): Promise<PDFAnalysis> => {
  const { data, error } = await supabase
    .from('pdf_analyses')
    .update(updates)
    .eq('id', analysisId)
    .select()
    .single()

  if (error) {
    console.error('Update analysis error:', error)
    throw new Error(`Failed to update PDF analysis: ${error.message}`)
  }

  return data
}

export const deletePDFAnalysis = async (analysisId: string): Promise<void> => {
  const { error } = await supabase
    .from('pdf_analyses')
    .delete()
    .eq('id', analysisId)

  if (error) {
    console.error('Delete analysis error:', error)
    throw new Error(`Failed to delete PDF analysis: ${error.message}`)
  }
}

// ============================================================================
// FLASHCARDS
// ============================================================================

export const createFlashcards = async (
  pdfAnalysisId: string,
  flashcards: Array<{ front: string; back: string; category: string }>
): Promise<PDFFlashcard[]> => {
  const { data, error } = await supabase
    .from('pdf_flashcards')
    .insert(
      flashcards.map(card => ({
        pdf_analysis_id: pdfAnalysisId,
        ...card
      }))
    )
    .select()

  if (error) {
    console.error('Create flashcards error:', error)
    throw new Error(`Failed to create flashcards: ${error.message}`)
  }

  return data
}

export const getFlashcards = async (pdfAnalysisId: string): Promise<PDFFlashcard[]> => {
  const { data, error } = await supabase
    .from('pdf_flashcards')
    .select('*')
    .eq('pdf_analysis_id', pdfAnalysisId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Get flashcards error:', error)
    throw new Error(`Failed to fetch flashcards: ${error.message}`)
  }

  return data || []
}

export const deleteFlashcard = async (flashcardId: string): Promise<void> => {
  const { error } = await supabase
    .from('pdf_flashcards')
    .delete()
    .eq('id', flashcardId)

  if (error) {
    console.error('Delete flashcard error:', error)
    throw new Error(`Failed to delete flashcard: ${error.message}`)
  }
}

// ============================================================================
// QUIZZES
// ============================================================================

export const createQuiz = async (
  pdfAnalysisId: string,
  questions: Array<{
    question: string
    options: string[]
    correct_answer: string
    explanation: string
    difficulty: string
  }>
): Promise<PDFQuiz[]> => {
  const { data, error } = await supabase
    .from('pdf_quizzes')
    .insert(
      questions.map(q => ({
        pdf_analysis_id: pdfAnalysisId,
        ...q
      }))
    )
    .select()

  if (error) {
    console.error('Create quiz error:', error)
    throw new Error(`Failed to create quiz: ${error.message}`)
  }

  return data
}

export const getQuiz = async (pdfAnalysisId: string): Promise<PDFQuiz[]> => {
  const { data, error } = await supabase
    .from('pdf_quizzes')
    .select('*')
    .eq('pdf_analysis_id', pdfAnalysisId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Get quiz error:', error)
    throw new Error(`Failed to fetch quiz: ${error.message}`)
  }

  return data || []
}

export const createQuizAttempt = async (
  userId: string,
  quizId: string,
  selectedAnswer: string,
  isCorrect: boolean
): Promise<PDFQuizAttempt> => {
  const { data, error } = await supabase
    .from('pdf_quiz_attempts')
    .insert({
      user_id: userId,
      pdf_quiz_id: quizId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect
    })
    .select()
    .single()

  if (error) {
    console.error('Create quiz attempt error:', error)
    throw new Error(`Failed to save quiz attempt: ${error.message}`)
  }

  return data
}

export const getQuizAttempts = async (userId: string, quizId: string): Promise<PDFQuizAttempt[]> => {
  const { data, error } = await supabase
    .from('pdf_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('pdf_quiz_id', quizId)
    .order('attempted_at', { ascending: false })

  if (error) {
    console.error('Get quiz attempts error:', error)
    throw new Error(`Failed to fetch quiz attempts: ${error.message}`)
  }

  return data || []
}

// ============================================================================
// CHAT SESSIONS
// ============================================================================

export const createChatSession = async (
  pdfAnalysisId: string,
  userId: string,
  title: string
): Promise<PDFChatSession> => {
  const { data, error } = await supabase
    .from('pdf_chat_sessions')
    .insert({
      pdf_analysis_id: pdfAnalysisId,
      user_id: userId,
      title
    })
    .select()
    .single()

  if (error) {
    console.error('Create chat session error:', error)
    throw new Error(`Failed to create chat session: ${error.message}`)
  }

  return data
}

export const getChatSessions = async (pdfAnalysisId: string): Promise<PDFChatSession[]> => {
  const { data, error } = await supabase
    .from('pdf_chat_sessions')
    .select('*')
    .eq('pdf_analysis_id', pdfAnalysisId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get chat sessions error:', error)
    throw new Error(`Failed to fetch chat sessions: ${error.message}`)
  }

  return data || []
}

export const createChatMessage = async (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<PDFChatMessage> => {
  const { data, error } = await supabase
    .from('pdf_chat_messages')
    .insert({
      chat_session_id: sessionId,
      role,
      content
    })
    .select()
    .single()

  if (error) {
    console.error('Create chat message error:', error)
    throw new Error(`Failed to create chat message: ${error.message}`)
  }

  return data
}

export const getChatMessages = async (sessionId: string): Promise<PDFChatMessage[]> => {
  const { data, error } = await supabase
    .from('pdf_chat_messages')
    .select('*')
    .eq('chat_session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Get chat messages error:', error)
    throw new Error(`Failed to fetch chat messages: ${error.message}`)
  }

  return data || []
}

// ============================================================================
// STUDY PLANS
// ============================================================================

export const createStudyPlan = async (
  pdfAnalysisId: string,
  userId: string,
  durationDays: number,
  planData: StudyPlanData
): Promise<PDFStudyPlan> => {
  const { data, error } = await supabase
    .from('pdf_study_plans')
    .insert({
      pdf_analysis_id: pdfAnalysisId,
      user_id: userId,
      duration_days: durationDays,
      plan_data: planData
    })
    .select()
    .single()

  if (error) {
    console.error('Create study plan error:', error)
    throw new Error(`Failed to create study plan: ${error.message}`)
  }

  return data
}

export const getStudyPlan = async (pdfAnalysisId: string): Promise<PDFStudyPlan | null> => {
  const { data, error } = await supabase
    .from('pdf_study_plans')
    .select('*')
    .eq('pdf_analysis_id', pdfAnalysisId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Get study plan error:', error)
    throw new Error(`Failed to fetch study plan: ${error.message}`)
  }

  return data
}

// ============================================================================
// MIND MAPS
// ============================================================================

export const createMindMap = async (
  pdfAnalysisId: string,
  mapData: MindMapData
): Promise<PDFMindMap> => {
  const { data, error } = await supabase
    .from('pdf_mind_maps')
    .insert({
      pdf_analysis_id: pdfAnalysisId,
      map_data: mapData
    })
    .select()
    .single()

  if (error) {
    console.error('Create mind map error:', error)
    throw new Error(`Failed to create mind map: ${error.message}`)
  }

  return data
}

export const getMindMap = async (pdfAnalysisId: string): Promise<PDFMindMap | null> => {
  const { data, error } = await supabase
    .from('pdf_mind_maps')
    .select('*')
    .eq('pdf_analysis_id', pdfAnalysisId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Get mind map error:', error)
    throw new Error(`Failed to fetch mind map: ${error.message}`)
  }

  return data
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

export const createTranslation = async (
  pdfAnalysisId: string,
  languageCode: string,
  translatedSummary: string,
  translatedExplanation: string
): Promise<PDFTranslation> => {
  const { data, error } = await supabase
    .from('pdf_translations')
    .insert({
      pdf_analysis_id: pdfAnalysisId,
      language_code: languageCode,
      translated_summary: translatedSummary,
      translated_explanation: translatedExplanation
    })
    .select()
    .single()

  if (error) {
    console.error('Create translation error:', error)
    throw new Error(`Failed to create translation: ${error.message}`)
  }

  return data
}

export const getTranslation = async (
  pdfAnalysisId: string,
  languageCode: string
): Promise<PDFTranslation | null> => {
  const { data, error } = await supabase
    .from('pdf_translations')
    .select('*')
    .eq('pdf_analysis_id', pdfAnalysisId)
    .eq('language_code', languageCode)
    .maybeSingle()

  if (error) {
    console.error('Get translation error:', error)
    throw new Error(`Failed to fetch translation: ${error.message}`)
  }

  return data
}
