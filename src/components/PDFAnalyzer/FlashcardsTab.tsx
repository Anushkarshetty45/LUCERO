import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getFlashcards, createFlashcards } from '../../services/pdfAnalysisApi'
import { recordDailyActivity } from '../../services/api'
import { generateFlashcardsPrompt } from '../../services/aiPrompts'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { callGemini } from '../../services/gemini'
import type { PDFFlashcard, GenerateFlashcardsResponse } from '../../types/pdfAnalysis'

interface FlashcardsTabProps {
  analysisId: string
  pdfContent: string
}

export default function FlashcardsTab({ analysisId, pdfContent }: FlashcardsTabProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { limits, incrementUsage } = useSubscription()
  const [flashcards, setFlashcards] = useState<PDFFlashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)

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
    if (!limits.canGenerateFlashcards) {
      setError(`🃏 Free plan limit: 3 flashcard sets per day. Upgrade to Pro for unlimited flashcards!`)
      return
    }
    setGenerating(true)
    setError('')

    if (!pdfContent || pdfContent.trim().length === 0) {
      setError(t('pdfAnalyzer.common.errorNoPDFContent'))
      setGenerating(false)
      return
    }

    try {
      const prompt = generateFlashcardsPrompt(pdfContent.substring(0, 15000))
      const aiResponse = await callGemini(prompt)

      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed: GenerateFlashcardsResponse = JSON.parse(jsonMatch[0])

        // Save to database
        const savedCards = await createFlashcards(analysisId, parsed.flashcards)
        setFlashcards(savedCards)
        setError('')

        if (user) {
          await recordDailyActivity(user.id, 'flashcard')
        }
        await incrementUsage('flashcard')
      } else {
        throw new Error(t('pdfAnalyzer.flashcards.errorParse'))
      }
    } catch (err: any) {
      console.error('Generate flashcards error:', err)
      setError(err.message || t('pdfAnalyzer.flashcards.errorGenerate'))
    } finally {
      setGenerating(false)
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

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>{t('pdfAnalyzer.flashcards.loading')}</p></div>
  }

  return (
    <div className="flashcards-tab">
      {flashcards.length === 0 ? (
        <div className="flashcards-generate">
          <div className="generate-icon">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="12" y1="5" x2="12" y2="19"/>
            </svg>
          </div>
          <h3>{t('pdfAnalyzer.flashcards.generateTitle')}</h3>
          <p>{t('pdfAnalyzer.flashcards.generateDescription')}</p>
          <button
            className="btn-generate"
            onClick={generateFlashcards}
            disabled={generating}
          >
            {generating ? t('pdfAnalyzer.flashcards.generating') : t('pdfAnalyzer.flashcards.generateButton')}
          </button>
          {error && (
            <div className="error-message" style={{ marginTop: '1rem', padding: '1rem', background: '#fee', color: '#c33', borderRadius: '8px' }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flashcards-header">
            <h3>{t('pdfAnalyzer.flashcards.title')}</h3>
            <span className="flashcard-count">
              {currentIndex + 1} / {flashcards.length}
            </span>
          </div>

          <div className="flashcard-viewer">
            <div
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                if (isFlipping) return
                setIsFlipping(true)
                setIsFlipped(!isFlipped)
                setTimeout(() => setIsFlipping(false), 600)
              }}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <div className="flashcard-category">{flashcards[currentIndex].category}</div>
                  <div className="flashcard-content">
                    {flashcards[currentIndex].front}
                  </div>
                  <div className="flashcard-hint">{t('pdfAnalyzer.flashcards.clickToFlip')}</div>
                </div>
                <div className="flashcard-back">
                  <div className="flashcard-category">{flashcards[currentIndex].category}</div>
                  <div className="flashcard-content">
                    {flashcards[currentIndex].back}
                  </div>
                  <div className="flashcard-hint">{t('pdfAnalyzer.flashcards.clickToSeeQuestion')}</div>
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
              ← {t('pdfAnalyzer.flashcards.previous')}
            </button>
            <button
              className="btn-flashcard-shuffle"
              onClick={() => {
                setIsFlipped(false)
                setIsFlipping(false)
                setCurrentIndex(Math.floor(Math.random() * flashcards.length))
              }}
            >
              {t('pdfAnalyzer.flashcards.random')}
            </button>
            <button
              className="btn-flashcard-nav"
              onClick={handleNext}
              disabled={flashcards.length <= 1}
            >
              {t('pdfAnalyzer.flashcards.next')} →
            </button>
          </div>

          <div className="flashcard-progress">
            <div className="progress-dots">
              {flashcards.map((_, idx) => (
                <div
                  key={idx}
                  className={`progress-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setIsFlipped(false)
                    setIsFlipping(false)
                    setCurrentIndex(idx)
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
