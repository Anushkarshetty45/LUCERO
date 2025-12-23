import { useState, useEffect } from 'react'
import { getFlashcards, createFlashcards } from '../../services/pdfAnalysisApi'
import { generateFlashcardsPrompt } from '../../services/aiPrompts'
import type { PDFFlashcard, GenerateFlashcardsResponse } from '../../types/pdfAnalysis'

interface FlashcardsTabProps {
  analysisId: string
  pdfContent: string
}

export default function FlashcardsTab({ analysisId, pdfContent }: FlashcardsTabProps) {
  const [flashcards, setFlashcards] = useState<PDFFlashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFlashcards()
  }, [analysisId])

  const loadFlashcards = async () => {
    try {
      setLoading(true)
      const data = await getFlashcards(analysisId)
      setFlashcards(data)
    } catch (err) {
      console.error('Load flashcards error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateFlashcards = async () => {
    setGenerating(true)
    setError('')

    if (!pdfContent || pdfContent.trim().length === 0) {
      setError('PDF content not available. Please re-upload and analyze the PDF.')
      setGenerating(false)
      return
    }

    try {
      const prompt = generateFlashcardsPrompt(pdfContent.substring(0, 15000))

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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      const aiResponse = data.text

      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateFlashcardsResponse = JSON.parse(jsonMatch[0])

        // Save to database
        const savedCards = await createFlashcards(analysisId, parsed.flashcards)
        setFlashcards(savedCards)
        setError('')
      } else {
        throw new Error('Failed to parse flashcards from AI response')
      }
    } catch (err: any) {
      console.error('Generate flashcards error:', err)
      setError(err.message || 'Failed to generate flashcards. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePrevious = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>Loading flashcards...</p></div>
  }

  return (
    <div className="flashcards-tab">
      {flashcards.length === 0 ? (
        <div className="flashcards-generate">
          <div className="generate-icon">🎴</div>
          <h3>Generate Flashcards</h3>
          <p>Create interactive flashcards from this PDF to help you study and memorize key concepts.</p>
          <button
            className="btn-generate"
            onClick={generateFlashcards}
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '✨ Generate Flashcards'}
          </button>
          {error && (
            <div className="error-message" style={{ marginTop: '1rem', padding: '1rem', background: '#fee', color: '#c33', borderRadius: '8px' }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flashcards-header">
            <h3>🎴 Flashcards</h3>
            <span className="flashcard-count">
              {currentIndex + 1} / {flashcards.length}
            </span>
          </div>

          <div className="flashcard-viewer">
            <div
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <div className="flashcard-category">{flashcards[currentIndex].category}</div>
                  <div className="flashcard-content">
                    {flashcards[currentIndex].front}
                  </div>
                  <div className="flashcard-hint">Click to flip</div>
                </div>
                <div className="flashcard-back">
                  <div className="flashcard-category">{flashcards[currentIndex].category}</div>
                  <div className="flashcard-content">
                    {flashcards[currentIndex].back}
                  </div>
                  <div className="flashcard-hint">Click to flip back</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flashcard-controls">
            <button
              className="btn-flashcard-nav"
              onClick={handlePrevious}
              disabled={flashcards.length <= 1}
            >
              ← Previous
            </button>
            <button
              className="btn-flashcard-shuffle"
              onClick={() => setCurrentIndex(Math.floor(Math.random() * flashcards.length))}
            >
              🔀 Random
            </button>
            <button
              className="btn-flashcard-nav"
              onClick={handleNext}
              disabled={flashcards.length <= 1}
            >
              Next →
            </button>
          </div>

          <div className="flashcard-progress">
            <div className="progress-dots">
              {flashcards.map((_, idx) => (
                <div
                  key={idx}
                  className={`progress-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => { setCurrentIndex(idx); setIsFlipped(false); }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
