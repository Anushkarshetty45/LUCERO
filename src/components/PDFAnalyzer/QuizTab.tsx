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

  useEffect(() => {
    loadQuiz()
  }, [analysisId])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const data = await getQuiz(analysisId)
      setQuiz(data)
    } catch (err) {
      console.error('Load quiz error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateQuizQuestions = async () => {
    setGenerating(true)

    if (!pdfContent || pdfContent.trim().length === 0) {
      alert('PDF content not available. Please re-upload and analyze the PDF.')
      setGenerating(false)
      return
    }

    try {
      const prompt = generateQuizPrompt(pdfContent.substring(0, 15000))

      const response = await fetch(
        'http://localhost:3002/api/claude',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            maxTokens: 3000
          })
        }
      )

      const data = await response.json()
      const aiResponse = data.text

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateQuizResponse = JSON.parse(jsonMatch[0])
        const savedQuiz = await createQuiz(analysisId, parsed.questions)
        setQuiz(savedQuiz)
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

    const isCorrect = answer === quiz[currentQuestion].correct_answer
    if (isCorrect) setScore(s => s + 1)

    await createQuizAttempt(userId, quiz[currentQuestion].id, answer, isCorrect)
  }

  const handleNext = async () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(q => q + 1)
      setSelectedAnswer('')
      setShowExplanation(false)
    } else {
      setQuizComplete(true)

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
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>Loading quiz...</p></div>
  }

  if (quiz.length === 0) {
    return (
      <div className="quiz-generate">
        <div className="generate-icon">✅</div>
        <h3>Generate Quiz</h3>
        <p>Test your knowledge with an AI-generated quiz based on this PDF content.</p>
        <button
          className="btn-generate"
          onClick={generateQuizQuestions}
          disabled={generating}
        >
          {generating ? '⏳ Generating...' : '✨ Generate Quiz'}
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
          {percentageNum >= 80 ? '🎉' : percentageNum >= 60 ? '👍' : '📚'}
        </div>
        <h2>Quiz Complete!</h2>
        <div className="score-display">
          <div className="score-number">{score} / {quiz.length}</div>
          <div className="score-percentage">{percentage}%</div>
        </div>
        <div className="score-message">
          {percentageNum >= 80 && "Excellent work! You've mastered this material! 🌟"}
          {percentageNum >= 60 && percentageNum < 80 && "Good job! Keep studying to improve further. 💪"}
          {percentageNum < 60 && "Keep studying! Review the material and try again. 📖"}
        </div>
        <button className="btn-restart" onClick={handleRestart}>
          🔄 Restart Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="quiz-tab">
      <div className="quiz-header">
        <h3>✅ Quiz</h3>
        <div className="quiz-progress-text">
          Question {currentQuestion + 1} of {quiz.length}
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
          {quiz[currentQuestion].options.map((option: string) => {
            const optionLetter = option.charAt(0)
            const isCorrect = optionLetter === quiz[currentQuestion].correct_answer
            const isSelected = optionLetter === selectedAnswer

            return (
              <button
                key={option}
                className={`quiz-option ${
                  showExplanation && isCorrect ? 'correct' :
                  showExplanation && isSelected && !isCorrect ? 'incorrect' :
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => !showExplanation && handleAnswerSelect(optionLetter)}
                disabled={showExplanation}
              >
                {option}
                {showExplanation && isCorrect && <span className="check-mark">✓</span>}
                {showExplanation && isSelected && !isCorrect && <span className="x-mark">✗</span>}
              </button>
            )
          })}
        </div>

        {showExplanation && (
          <div className="quiz-explanation">
            <h4>💡 Explanation</h4>
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
