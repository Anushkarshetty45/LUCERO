import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getCourses, getLessons, recordDailyActivity, startStudySession, endStudySession } from '../services/api'
import { useSubscription } from '../hooks/useSubscription'
import { callGemini } from '../services/gemini'
import type { Course, Lesson } from '../types'
import './FlashcardsModal.css'

interface FlashcardsModalProps {
  onClose: () => void
  userId: string
}

interface Flashcard {
  id: string | number
  question: string
  answer: string
  category: string
}

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  category: string
}

type ViewMode = 'select-course' | 'select-topics' | 'generating' | 'study' | 'generating-quiz' | 'quiz'

export default function FlashcardsModal({ onClose, userId }: FlashcardsModalProps) {
  const { t } = useTranslation()
  const { limits, incrementUsage } = useSubscription()
  const [viewMode, setViewMode] = useState<ViewMode>('select-course')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Lesson[]>([])
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({})
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  // Track study time while Flashcards modal is open
  useEffect(() => {
    startStudySession(userId)
      .then(session => {
        sessionIdRef.current = session.id
        sessionStartRef.current = new Date()
      })
      .catch(err => console.error('Failed to start flashcards study session:', err))

    return () => {
      if (sessionIdRef.current && sessionStartRef.current) {
        const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        if (duration >= 60) {
          endStudySession(sessionIdRef.current, duration, userId)
            .catch(err => console.error('Failed to end flashcards study session:', err))
        }
      }
    }
  }, [userId])

  useEffect(() => {
    loadCourses()
  }, [userId])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await getCourses(userId)
      setCourses(data)
    } catch (err) {
      console.error('Error loading courses:', err)
      setError(t('flashcardsModal.errorLoadCourses'))
    } finally {
      setLoading(false)
    }
  }


  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course)
    setLoading(true)
    setError('')

    try {
      const lessonsData = await getLessons(course.id)
      setTopics(lessonsData)
      setViewMode('select-topics')
    } catch (err) {
      console.error('Error loading topics:', err)
      setError(t('flashcardsModal.errorLoadTopics'))
    } finally {
      setLoading(false)
    }
  }

  const toggleTopicSelection = (topicId: string) => {
    const newSelection = new Set(selectedTopics)
    if (newSelection.has(topicId)) {
      newSelection.delete(topicId)
    } else {
      newSelection.add(topicId)
    }
    setSelectedTopics(newSelection)
  }

  const generateFlashcards = async () => {
    if (selectedTopics.size === 0) {
      setError(t('flashcardsModal.errorSelectTopic'))
      return
    }

    if (!limits.canGenerateFlashcards) {
      setError(`🃏 Free plan limit: 3 flashcard sets per day. You've reached today's limit. Upgrade to Pro for unlimited flashcards!`)
      return
    }

    setViewMode('generating')
    setError('')

    try {
      // Get selected topics' content
      const selectedTopicsData = topics.filter(t => selectedTopics.has(t.id))
      const topicsContent = selectedTopicsData.map(t => ({
        title: t.title,
        content: t.content || ''
      }))

      const prompt = `Generate EXACTLY 15 flashcards covering the MOST CRITICAL concepts from these topics.

Course: ${selectedCourse?.title}
Topics:
${topicsContent.map(t => `\n### ${t.title}\n${t.content}`).join('\n')}

REQUIREMENTS:
- EXACTLY 15 flashcards
- Focus on: key definitions, core principles, critical formulas, must-know facts
- Keep answers VERY SHORT (1-2 sentences max)
- Use plain text only (no bullet points, no markdown, no asterisks, no bold)
- Skip minor details

Return ONLY this JSON (no code blocks, no extra text):
{
  "flashcards": [
    {
      "question": "Question here",
      "answer": "Short answer here",
      "category": "Topic name"
    }
  ]
}`

      const aiResponse = await callGemini(prompt, { generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 8000 } })

      // Parse JSON response - handle markdown code blocks and plain JSON
      let jsonStr = aiResponse.trim()

      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      } else {
        // Try to find JSON object in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }
      }

      // Clean up any potential issues
      jsonStr = jsonStr.trim()

      // If JSON is incomplete, try to fix it by closing arrays/objects
      let parseSuccessful = false
      try {
        JSON.parse(jsonStr)
        parseSuccessful = true
      } catch (e) {
        console.log('Initial parse failed, attempting to fix incomplete JSON...')
      }

      if (!parseSuccessful) {
        // Try to fix incomplete JSON
        let fixedJson = jsonStr

        // Remove any trailing incomplete text after the last complete object
        // Find the last complete flashcard object
        const lastCompleteMatch = fixedJson.lastIndexOf('}')
        if (lastCompleteMatch !== -1) {
          // Check if there's an incomplete object after this
          const afterLast = fixedJson.substring(lastCompleteMatch + 1).trim()
          if (afterLast.startsWith(',')) {
            // Remove the comma and anything after
            fixedJson = fixedJson.substring(0, lastCompleteMatch + 1)
          }
        }

        // Count brackets
        const openBraces = (fixedJson.match(/\{/g) || []).length
        const closeBraces = (fixedJson.match(/\}/g) || []).length
        const openBrackets = (fixedJson.match(/\[/g) || []).length
        const closeBrackets = (fixedJson.match(/\]/g) || []).length

        // Add missing closing brackets
        for (let i = 0; i < (openBrackets - closeBrackets); i++) {
          fixedJson += '\n]'
        }
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          fixedJson += '\n}'
        }

        jsonStr = fixedJson
      }

      try {
        const parsed = JSON.parse(jsonStr)
        const flashcardsArray = parsed.flashcards || parsed

        if (!Array.isArray(flashcardsArray)) {
          throw new Error(t('flashcardsModal.errorInvalidFormat'))
        }

        // Filter out incomplete cards
        const validCards = flashcardsArray.filter((card: any) =>
          card.question && card.answer && card.question.trim() && card.answer.trim()
        )

        if (validCards.length === 0) {
          throw new Error(t('flashcardsModal.errorNoValidCards'))
        }

        const generatedCards = validCards.map((card: any, idx: number) => ({
          id: idx + 1,
          question: card.question,
          answer: card.answer,
          category: card.category || 'General'
        }))

        setFlashcards(generatedCards)
        setViewMode('study')

        await recordDailyActivity(userId, 'flashcard')
        await incrementUsage('flashcard')
      } catch (parseError: any) {
        console.error('Error processing flashcards:', parseError)
        throw new Error(parseError.message || t('flashcardsModal.errorProcessFlashcards'))
      }
    } catch (err: any) {
      console.error('Error generating flashcards:', err)
      setError(err.message || t('flashcardsModal.errorGenerateRetry'))
      setViewMode('select-topics')
    }
  }

  const generateQuiz = async () => {
    if (!limits.canGenerateQuiz) {
      setError(`📝 Free plan limit: 3 quizzes per day. You've reached today's limit. Upgrade to Pro for unlimited quizzes!`)
      return
    }

    setViewMode('generating-quiz')
    setError('')

    try {
      // Get selected topics' content
      const selectedTopicsData = topics.filter(t => selectedTopics.has(t.id))
      const topicsContent = selectedTopicsData.map(t => ({
        title: t.title,
        content: t.content || ''
      }))

      // Include flashcards context if available
      const flashcardsContext = flashcards.length > 0
        ? `\n\nGenerated Flashcards:\n${flashcards.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
        : ''

      const prompt = `Generate EXACTLY 10 multiple-choice quiz questions based on these course topics.

Course: ${selectedCourse?.title}
Topics:
${topicsContent.map(t => `\n### ${t.title}\n${t.content}`).join('\n')}${flashcardsContext}

REQUIREMENTS:
- EXACTLY 10 multiple-choice questions
- Focus on: key concepts, definitions, formulas, important facts
- Each question must have 4 options (A, B, C, D)
- Only ONE correct answer per question
- Make questions clear and test understanding
- Mix difficulty levels

Return ONLY this JSON (no code blocks, no extra text):
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "category": "Topic name"
    }
  ]
}

Note: correctAnswer is the index (0-3) of the correct option.`

      const aiResponse = await callGemini(prompt, { generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 6000 } })

      // Parse JSON response
      let jsonStr = aiResponse.trim()

      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      } else {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }
      }

      try {
        const parsed = JSON.parse(jsonStr)
        const questionsArray = parsed.questions || parsed

        if (!Array.isArray(questionsArray)) {
          throw new Error(t('flashcardsModal.errorInvalidQuizFormat'))
        }

        const validQuestions = questionsArray.filter((q: any) =>
          q.question && q.options && Array.isArray(q.options) && q.options.length === 4
        )

        if (validQuestions.length === 0) {
          throw new Error(t('flashcardsModal.errorNoValidQuestions'))
        }

        const generatedQuiz = validQuestions.map((q: any, idx: number) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer || 0,
          category: q.category || 'General'
        }))

        setQuizQuestions(generatedQuiz)
        setSelectedAnswers({})
        setShowQuizResults(false)
        setCurrentQuizIndex(0)
        setViewMode('quiz')
        await incrementUsage('quiz')
      } catch (parseError) {
        console.error('Error parsing quiz:', parseError)
        throw new Error(t('flashcardsModal.errorParseQuiz'))
      }
    } catch (err: any) {
      console.error('Error generating quiz:', err)
      setError(err.message || t('flashcardsModal.errorGenerateQuizRetry'))
      setViewMode('study')
    }
  }

  const handleQuizAnswer = (questionId: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleQuizSubmit = () => {
    setShowQuizResults(true)
  }

  const handleNextQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(prev => prev - 1)
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    setIsFlipping(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePrevious = () => {
    setIsFlipped(false)
    setIsFlipping(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  const handleReset = () => {
    setViewMode('select-course')
    setSelectedCourse(null)
    setSelectedTopics(new Set())
    setFlashcards([])
    setCurrentIndex(0)
    setIsFlipped(false)
    setError('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="flashcards-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('flashcardsModal.title')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Course Selection View */}
          {viewMode === 'select-course' && (
            <div className="selection-view">
              <h3>{t('flashcardsModal.selectCourse')}</h3>
              <p>{t('flashcardsModal.chooseCourse')}</p>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>{t('flashcardsModal.loadingCourses')}</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="empty-state">
                  <p>{t('flashcardsModal.noCourses')}</p>
                </div>
              ) : (
                <div className="courses-list">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      className="course-option"
                      onClick={() => handleCourseSelect(course)}
                      style={{ borderLeft: `4px solid ${course.color}` }}
                    >
                      <div className="course-info">
                        <h4>{course.title}</h4>
                        <p>{course.subject}</p>
                      </div>
                      <span className="arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Topic Selection View */}
          {viewMode === 'select-topics' && (
            <div className="selection-view">
              <div className="breadcrumb">
                <button onClick={() => setViewMode('select-course')}>{t('flashcardsModal.backToCourses')}</button>
              </div>

              <h3>{selectedCourse?.title}</h3>
              <p>{t('flashcardsModal.selectTopics')}</p>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>{t('flashcardsModal.loadingTopics')}</p>
                </div>
              ) : topics.length === 0 ? (
                <div className="empty-state">
                  <p>{t('flashcardsModal.noTopics')}</p>
                </div>
              ) : (
                <>
                  <div className="topics-list">
                    {topics.map(topic => (
                      <label
                        key={topic.id}
                        className={`topic-option ${selectedTopics.has(topic.id) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTopics.has(topic.id)}
                          onChange={() => toggleTopicSelection(topic.id)}
                        />
                        <div className="topic-info">
                          <h4>{topic.title}</h4>
                          {topic.content && (
                            <p className="topic-preview">
                              {topic.content.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="action-bar">
                    <div className="selection-count">
                      {t('flashcardsModal.topicsSelected', { count: selectedTopics.size })}
                    </div>
                    <button
                      className="btn-generate-cards"
                      onClick={generateFlashcards}
                      disabled={selectedTopics.size === 0}
                    >
                      {t('flashcardsModal.generateFlashcards')}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          {/* Generating View */}
          {viewMode === 'generating' && (
            <div className="generating-view">
              <div className="spinner-large"></div>
              <h3>{t('flashcardsModal.generatingFlashcards')}</h3>
              <p>{t('flashcardsModal.generatingDescription')}</p>
            </div>
          )}

          {/* Study View */}
          {viewMode === 'study' && flashcards.length > 0 && (
            <div className="study-view">
              <div className="study-header">
                <button className="btn-back" onClick={handleReset}>
                  {t('flashcardsModal.newSet')}
                </button>
                <div className="flashcard-count">
                  {currentIndex + 1} / {flashcards.length}
                </div>
              </div>

              <div className="flashcard-container">
                <div
                  className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => {
                    if (isFlipping) return
                    setIsFlipping(true)
                    setIsFlipped(!isFlipped)
                    setTimeout(() => setIsFlipping(false), 600)
                  }}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <div className="flashcard-category">
                        {flashcards[currentIndex].category}
                      </div>
                      <div className="flashcard-content">
                        <p>{flashcards[currentIndex].question}</p>
                      </div>
                      <div className="flashcard-hint">{t('flashcardsModal.clickToSeeAnswer')}</div>
                    </div>
                    <div className="flashcard-back">
                      <div className="flashcard-category">
                        {flashcards[currentIndex].category}
                      </div>
                      <div className="flashcard-content">
                        <p>{flashcards[currentIndex].answer}</p>
                      </div>
                      <div className="flashcard-hint">{t('flashcardsModal.clickToSeeQuestion')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flashcard-controls">
                <button
                  className="btn-nav"
                  onClick={handlePrevious}
                  disabled={flashcards.length <= 1}
                >
                  {t('flashcardsModal.previous')}
                </button>
                <button
                  className="btn-shuffle"
                  onClick={() => {
                    setCurrentIndex(Math.floor(Math.random() * flashcards.length))
                    setIsFlipped(false)
                    setIsFlipping(false)
                  }}
                >
                  {t('flashcardsModal.shuffle')}
                </button>
                <button
                  className="btn-nav"
                  onClick={handleNext}
                  disabled={flashcards.length <= 1}
                >
                  {t('flashcardsModal.next')}
                </button>
              </div>

              <div className="progress-dots">
                {flashcards.map((_, idx) => (
                  <div
                    key={idx}
                    className={`dot ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setIsFlipped(false)
                      setIsFlipping(false)
                    }}
                  />
                ))}
              </div>

              {/* Generate Quiz Button */}
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button className="btn-generate-cards" onClick={generateQuiz}>
                  {t('flashcardsModal.takeQuiz')}
                </button>
              </div>
            </div>
          )}

          {/* Generating Quiz View */}
          {viewMode === 'generating-quiz' && (
            <div className="generating-view">
              <div className="spinner-large"></div>
              <h3>{t('flashcardsModal.generatingQuiz')}</h3>
              <p>{t('flashcardsModal.generatingQuizDescription')}</p>
            </div>
          )}

          {/* Quiz View */}
          {viewMode === 'quiz' && quizQuestions.length > 0 && (
            <div className="study-view">
              <div className="study-header">
                <button className="btn-back" onClick={() => setViewMode('study')}>
                  {t('flashcardsModal.backToFlashcards')}
                </button>
                <div className="flashcard-count">
                  {t('flashcardsModal.questionProgress', { current: currentQuizIndex + 1, total: quizQuestions.length })}
                </div>
              </div>

              {!showQuizResults ? (
                <>
                  {/* Quiz Question */}
                  <div className="quiz-container">
                    <div className="quiz-question">
                      <div className="quiz-category">
                        {quizQuestions[currentQuizIndex].category}
                      </div>
                      <h3>{quizQuestions[currentQuizIndex].question}</h3>
                    </div>

                    {/* Quiz Options */}
                    <div className="quiz-options">
                      {quizQuestions[currentQuizIndex].options.map((option, idx) => (
                        <button
                          key={idx}
                          className={`quiz-option ${
                            selectedAnswers[quizQuestions[currentQuizIndex].id] === idx
                              ? 'selected'
                              : ''
                          }`}
                          onClick={() => handleQuizAnswer(quizQuestions[currentQuizIndex].id, idx)}
                        >
                          <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                          <span className="option-text">{option}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quiz Navigation */}
                  <div className="flashcard-controls">
                    <button
                      className="btn-nav"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuizIndex === 0}
                    >
                      {t('flashcardsModal.previous')}
                    </button>
                    {currentQuizIndex === quizQuestions.length - 1 ? (
                      <button
                        className="btn-generate-cards"
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(selectedAnswers).length !== quizQuestions.length}
                      >
                        {t('flashcardsModal.submitQuiz')}
                      </button>
                    ) : (
                      <button
                        className="btn-nav"
                        onClick={handleNextQuestion}
                        disabled={currentQuizIndex === quizQuestions.length - 1}
                      >
                        {t('flashcardsModal.next')}
                      </button>
                    )}
                  </div>

                  {/* Quiz Progress Dots */}
                  <div className="progress-dots">
                    {quizQuestions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`dot ${idx === currentQuizIndex ? 'active' : ''} ${
                          selectedAnswers[quizQuestions[idx].id] !== undefined ? 'answered' : ''
                        }`}
                        onClick={() => setCurrentQuizIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                /* Quiz Results */
                <div className="quiz-results">
                  <div className="results-header">
                    <h2>{t('flashcardsModal.quizComplete')}</h2>
                    <div className="score-display">
                      <div className="score-circle">
                        {Math.round((Object.values(selectedAnswers).filter((ans, idx) =>
                          ans === quizQuestions[idx].correctAnswer
                        ).length / quizQuestions.length) * 100)}%
                      </div>
                      <p>
                        {t('flashcardsModal.correctAnswers', {
                          correct: Object.values(selectedAnswers).filter((ans, idx) =>
                            ans === quizQuestions[idx].correctAnswer
                          ).length,
                          total: quizQuestions.length
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Results Breakdown */}
                  <div className="results-breakdown">
                    {quizQuestions.map((q, idx) => {
                      const userAnswer = selectedAnswers[q.id]
                      const isCorrect = userAnswer === q.correctAnswer

                      return (
                        <div key={q.id} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                          <div className="result-header">
                            <span className="result-icon">{isCorrect ? '✓' : '✗'}</span>
                            <span className="result-question">{t('flashcardsModal.questionNumber', { number: idx + 1 })}</span>
                          </div>
                          <p className="result-question-text">{q.question}</p>
                          <div className="result-answers">
                            <p className="user-answer">
                              {t('flashcardsModal.yourAnswer')}: <strong>{q.options[userAnswer]}</strong>
                            </p>
                            {!isCorrect && (
                              <p className="correct-answer">
                                {t('flashcardsModal.correctAnswer')}: <strong>{q.options[q.correctAnswer]}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Results Actions */}
                  <div className="results-actions">
                    <button className="btn-nav" onClick={() => {
                      setShowQuizResults(false)
                      setSelectedAnswers({})
                      setCurrentQuizIndex(0)
                    }}>
                      {t('flashcardsModal.retryQuiz')}
                    </button>
                    <button className="btn-generate-cards" onClick={generateQuiz}>
                      {t('flashcardsModal.newQuiz')}
                    </button>
                    <button className="btn-nav" onClick={() => setViewMode('study')}>
                      {t('flashcardsModal.backToFlashcards')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
