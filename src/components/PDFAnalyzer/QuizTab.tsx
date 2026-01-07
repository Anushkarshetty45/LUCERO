import { useState, useEffect } from 'react'
import { getQuiz, createQuiz, createQuizAttempt } from '../../services/pdfAnalysisApi'
import { recordDailyActivity } from '../../services/api'
import { generateQuizPrompt } from '../../services/aiPrompts'
import type { PDFQuiz, GenerateQuizResponse } from '../../types/pdfAnalysis'

interface QuizTabProps {
  analysisId: string
  pdfContent: string
  userId: string
}

export default function QuizTab({ analysisId, pdfContent, userId }: QuizTabProps) {
  const [quiz, setQuiz] = useState<PDFQuiz[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quizComplete, setQuizComplete] = useState(false)

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [timePerQuestion, setTimePerQuestion] = useState(30) // 30 seconds per question

  // Question count selector
  const [showQuestionSelector, setShowQuestionSelector] = useState(false)
  const [questionCount, setQuestionCount] = useState(10)

  useEffect(() => {
    loadQuiz()
  }, [analysisId])

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up for this question
          if (!showExplanation) {
            handleTimeUp()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, timeRemaining, showExplanation])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const data = await getQuiz(analysisId)
      setQuiz(data)
      if (data.length > 0) {
        setTimeRemaining(timePerQuestion)
        setTimerActive(true)
      }
    } catch (err) {
      console.error('Load quiz error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUp = () => {
    // Auto-select wrong answer when time runs out
    setSelectedAnswer('TIMEOUT')
    setShowExplanation(true)
    setTimerActive(false)
  }

  const handleQuestionCountSelect = async () => {
    await generateQuizQuestions(questionCount)
    setShowQuestionSelector(false)
  }

  const generateQuizQuestions = async (count: number) => {
    setGenerating(true)

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY

    if (!apiKey) {
      alert('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to your .env file')
      setGenerating(false)
      return
    }

    if (!pdfContent || pdfContent.trim().length === 0) {
      alert('PDF content not available. Please re-upload and analyze the PDF.')
      setGenerating(false)
      return
    }

    try {
      const prompt = `${generateQuizPrompt(pdfContent.substring(0, 15000))}

IMPORTANT: Generate EXACTLY ${count} questions. No more, no less.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192
            }
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate quiz')
      }

      const aiResponse = data.candidates[0].content.parts[0].text

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateQuizResponse = JSON.parse(jsonMatch[0])
        // Limit to requested count
        const limitedQuestions = parsed.questions.slice(0, count)
        const savedQuiz = await createQuiz(analysisId, limitedQuestions)
        setQuiz(savedQuiz)
        setTimeRemaining(timePerQuestion)
        setTimerActive(true)
      }
    } catch (err) {
      console.error('Generate quiz error:', err)
      alert('Failed to generate quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerSelect = async (answer: string) => {
    setSelectedAnswer(answer)
    setShowExplanation(true)
    setTimerActive(false)

    const isCorrect = answer === quiz[currentQuestion].correct_answer
    if (isCorrect) setScore(s => s + 1)

    await createQuizAttempt(userId, quiz[currentQuestion].id, answer, isCorrect)
  }

  const handleNext = async () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(q => q + 1)
      setSelectedAnswer('')
      setShowExplanation(false)
      setTimeRemaining(timePerQuestion)
      setTimerActive(true)
    } else {
      setQuizComplete(true)
      setTimerActive(false)

      // Record quiz activity for streak
      await recordDailyActivity(userId, 'quiz')
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer('')
    setShowExplanation(false)
    setScore(0)
    setQuizComplete(false)
    setTimeRemaining(timePerQuestion)
    setTimerActive(true)
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>Loading quiz...</p></div>
  }

  if (quiz.length === 0) {
    if (showQuestionSelector) {
      return (
        <div className="quiz-generate">
          <div className="generate-icon">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </div>
          <h3>How many questions?</h3>
          <p>Select the number of quiz questions you'd like to generate</p>

          <div className="question-count-options">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                className={`count-option ${questionCount === count ? 'selected' : ''}`}
                onClick={() => setQuestionCount(count)}
              >
                {count} Questions
              </button>
            ))}
          </div>

          <div className="selector-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowQuestionSelector(false)}
            >
              Cancel
            </button>
            <button
              className="btn-generate"
              onClick={handleQuestionCountSelect}
              disabled={generating}
            >
              {generating ? 'Generating...' : `Generate ${questionCount} Questions`}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="quiz-generate">
        <div className="generate-icon">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </div>
        <h3>Generate Quiz</h3>
        <p>Test your knowledge with an AI-generated quiz based on this PDF content.</p>
        <button
          className="btn-generate"
          onClick={() => setShowQuestionSelector(true)}
        >
          Generate Quiz
        </button>
      </div>
    )
  }

  if (quizComplete) {
    const percentageNum = (score / quiz.length) * 100
    const percentage = percentageNum.toFixed(1)
    return (
      <div className="quiz-results">
        <div className="results-icon">
          {percentageNum >= 80 ? '★' : percentageNum >= 60 ? '✓' : '○'}
        </div>
        <h2>Quiz Complete!</h2>
        <div className="score-display">
          <div className="score-number">{score} / {quiz.length}</div>
          <div className="score-percentage">{percentage}%</div>
        </div>
        <div className="score-message">
          {percentageNum >= 80 && "Excellent work! You've mastered this material!"}
          {percentageNum >= 60 && percentageNum < 80 && "Good job! Keep studying to improve further."}
          {percentageNum < 60 && "Keep studying! Review the material and try again."}
        </div>
        <button className="btn-restart" onClick={handleRestart}>
          Restart Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="quiz-tab">
      <div className="quiz-header">
        <h3>Quiz</h3>
        <div className="quiz-meta">
          <div className="quiz-progress-text">
            Question {currentQuestion + 1} of {quiz.length}
          </div>
          <div className={`quiz-timer ${timeRemaining <= 10 ? 'warning' : ''} ${timeRemaining <= 5 ? 'critical' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
        />
      </div>

      <div className="quiz-question-container">
        <div className="quiz-difficulty-badge" data-difficulty={quiz[currentQuestion].difficulty}>
          {quiz[currentQuestion].difficulty}
        </div>

        <div className="quiz-question">
          {quiz[currentQuestion].question}
        </div>

        <div className="quiz-options">
          {quiz[currentQuestion].options.map((option: string, idx: number) => {
            // Extract option letter - handle both "A) Text" format and plain "Text" format
            const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D
            const optionText = option.startsWith(optionLetter + ')')
              ? option.substring(3).trim()
              : option
            const isCorrect = optionLetter === quiz[currentQuestion].correct_answer
            const isSelected = optionLetter === selectedAnswer

            return (
              <button
                key={idx}
                className={`quiz-option ${
                  showExplanation && isCorrect ? 'correct' :
                  showExplanation && isSelected && !isCorrect ? 'incorrect' :
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => !showExplanation && handleAnswerSelect(optionLetter)}
                disabled={showExplanation}
              >
                {optionLetter}) {optionText}
                {showExplanation && isCorrect && <span className="check-mark">✓</span>}
                {showExplanation && isSelected && !isCorrect && <span className="x-mark">✗</span>}
              </button>
            )
          })}
        </div>

        {selectedAnswer === 'TIMEOUT' && showExplanation && (
          <div className="timeout-message">
            Time's up! The correct answer was <strong>{quiz[currentQuestion].correct_answer}</strong>
          </div>
        )}

        {showExplanation && (
          <div className="quiz-explanation">
            <h4>Explanation</h4>
            <p>{quiz[currentQuestion].explanation}</p>
            <button className="btn-next-question" onClick={handleNext}>
              {currentQuestion < quiz.length - 1 ? 'Next Question →' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
