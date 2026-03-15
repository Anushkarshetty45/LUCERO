import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import * as pdfjsLib from 'pdfjs-dist'
import { uploadPDFToStorage, createPDFAnalysis } from '../../services/pdfAnalysisApi'
import { recordDailyActivity, startStudySession, endStudySession } from '../../services/api'
import { generateAnalysisPrompt } from '../../services/aiPrompts'
import AnalysisTab from './AnalysisTab'
import HistoryTab from './HistoryTab'
import FlashcardsTab from './FlashcardsTab'
import QuizTab from './QuizTab'
import MindMapTab from './MindMapTab'
import './PDFAnalyzerModal.css'

// Set up PDF.js worker - using local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFAnalyzerModalProps {
  onClose: () => void
}

type TabType = 'upload' | 'analysis' | 'history' | 'flashcards' | 'quiz' | 'mindmap'

export default function PDFAnalyzerModal({ onClose }: PDFAnalyzerModalProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { limits, incrementUsage } = useSubscription()
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [isMaximized, setIsMaximized] = useState(false)

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analysis data
  const [pdfContent, setPdfContent] = useState('')
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [explanation, setExplanation] = useState('')
  const [title, setTitle] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>()
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  // Track study time while PDF Analyzer is open
  useEffect(() => {
    if (!user) return
    startStudySession(user.id)
      .then(session => {
        sessionIdRef.current = session.id
        sessionStartRef.current = new Date()
      })
      .catch(err => console.error('Failed to start PDF study session:', err))

    return () => {
      if (sessionIdRef.current && sessionStartRef.current) {
        const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        if (duration >= 60) {
          endStudySession(sessionIdRef.current, duration, user.id)
            .catch(err => console.error('Failed to end PDF study session:', err))
        }
      }
    }
  }, [user])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    // Security: Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError(t('pdfAnalyzer.upload.errorInvalidFile'))
      return
    }

    // Security: Validate file extension
    const fileName = selectedFile.name.toLowerCase()
    if (!fileName.endsWith('.pdf')) {
      setError('Invalid file extension. Only PDF files are allowed.')
      return
    }

    // Security: Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size too large. Maximum allowed size is 50MB.')
      return
    }

    // Security: Validate minimum file size (at least 100 bytes)
    if (selectedFile.size < 100) {
      setError('File is too small or corrupted.')
      return
    }

    setFile(selectedFile)
    setError('')
    setTitle(selectedFile.name.replace('.pdf', ''))
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()

    // Security: Validate PDF file signature (magic bytes)
    // PDFs should start with "%PDF-" (hex: 25 50 44 46 2D)
    const uint8Array = new Uint8Array(arrayBuffer)
    const pdfSignature = '%PDF-'
    const fileHeader = String.fromCharCode(...Array.from(uint8Array.slice(0, 5)))

    if (fileHeader !== pdfSignature) {
      throw new Error('Invalid PDF file signature. File may be corrupted or not a valid PDF.')
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const numPages = pdf.numPages
    setPageCount(numPages)
    let fullText = ''

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      setProgress(Math.round((pageNum / numPages) * 50))
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n\n'
    }

    return fullText
  }

  const analyzeWithAI = async (text: string) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error(t('pdfAnalyzer.common.errorNoApiKey'))
    }

    const maxLength = 30000
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text

    const prompt = generateAnalysisPrompt(truncatedText)

    setProgress(60)

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

    setProgress(80)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || t('pdfAnalyzer.common.errorAnalysisFailed'))
    }

    const data = await response.json()
    const aiResponse = data.candidates[0].content.parts[0].text

    setProgress(100)

    const summaryMatch = aiResponse.match(/## SUMMARY\s*([\s\S]*?)(?=## EXPLANATION|$)/i)
    const explanationMatch = aiResponse.match(/## EXPLANATION\s*([\s\S]*?)$/i)

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : aiResponse.split('\n\n')[0],
      explanation: explanationMatch ? explanationMatch[1].trim() : aiResponse
    }
  }

  const handleAnalyze = async () => {
    if (!file || !user) return

    // Subscription limits temporarily disabled - all users have full access
    // if (!limits.canUploadPDF) {
    //   setError(
    //     `📊 Upload Limit Reached!\n\n` +
    //     `Free plan: 5 PDF uploads/month\n` +
    //     `You've used all your uploads this month.\n\n` +
    //     `Upgrade to Pro for unlimited uploads!`
    //   )
    //   return
    // }

    setExtracting(true)
    setAnalyzing(false)
    setError('')
    setProgress(0)

    try {
      // Extract text from PDF
      const text = await extractTextFromPDF(file)

      if (!text.trim()) {
        throw new Error(t('pdfAnalyzer.upload.errorNoText'))
      }

      setPdfContent(text)
      setExtracting(false)
      setAnalyzing(true)
      setProgress(50)

      // Analyze with AI
      const result = await analyzeWithAI(text)
      setSummary(result.summary)
      setExplanation(result.explanation)
      setProgress(100)
      setAnalyzing(false)

      // Upload PDF to storage
      const { fileName, url } = await uploadPDFToStorage(file, user.id)

      // Save analysis to database
      const analysis = await createPDFAnalysis({
        userId: user.id,
        courseId: selectedCourseId,
        fileName,
        fileUrl: url,
        fileSize: file.size,
        title,
        summary: result.summary,
        explanation: result.explanation,
        keyTerms: [],
        pageCount,
        analyzedPages: 'all'
      })

      setAnalysisId(analysis.id)

      // Record PDF analysis activity for streak
      await recordDailyActivity(user.id, 'pdf_analysis')

      // Subscription usage tracking temporarily disabled
      // await incrementUsage('pdf_upload')

      // Auto-navigate to Analysis tab after successful analysis
      setActiveTab('analysis')

    } catch (err: any) {
      console.error('PDF Analysis Error:', err)
      setError(err.message || t('pdfAnalyzer.common.errorAnalysisFailed'))
      setExtracting(false)
      setAnalyzing(false)
      setProgress(0)
    }
  }

  const handleLoadAnalysis = (loadedAnalysisId: string, data: any) => {
    setAnalysisId(loadedAnalysisId)
    setTitle(data.title)
    setSummary(data.summary)
    setExplanation(data.explanation)
    setPdfContent('') // We don't store full content
    setPageCount(data.page_count)
    setActiveTab('analysis')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="upload-section">
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3>{t('pdfAnalyzer.upload.title')}</h3>
              <p>{t('pdfAnalyzer.upload.description')}</p>

              {/* Subscription limits temporarily disabled - usage counter hidden */}
              {/* {!limits.isPro && (
                <div style={{
                  margin: '1rem 0',
                  padding: '0.75rem',
                  background: limits.canUploadPDF ? '#e3f2fd' : '#ffebee',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: limits.canUploadPDF ? '#1565c0' : '#c62828'
                }}>
                  📊 {limits.canUploadPDF
                    ? `${limits.remainingPDFUploads} PDF uploads remaining this month`
                    : 'Upload limit reached! Upgrade to Pro for unlimited uploads.'}
                </div>
              )} */}

              <button
                className="btn-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting || analyzing}
              >
                {file ? file.name : t('pdfAnalyzer.upload.chooseFile')}
              </button>

              {file && (
                <div className="file-info">
                  <input
                    type="text"
                    className="title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('pdfAnalyzer.upload.titlePlaceholder')}
                  />
                </div>
              )}
            </div>

            {file && !extracting && !analyzing && (
              <div className="file-actions">
                <button className="btn-analyze" onClick={handleAnalyze}>
                  {t('pdfAnalyzer.upload.analyzePDF')}
                </button>
                <button className="btn-remove" onClick={() => setFile(null)}>
                  {t('pdfAnalyzer.upload.remove')}
                </button>
              </div>
            )}

            {(extracting || analyzing) && (
              <div className="processing-status">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p>
                  {extracting && t('pdfAnalyzer.upload.extracting')}
                  {analyzing && t('pdfAnalyzer.upload.analyzing')}
                </p>
                <span className="progress-text">{progress}%</span>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        )

      case 'analysis':
        return <AnalysisTab summary={summary} explanation={explanation} title={title} />

      case 'history':
        return user ? <HistoryTab userId={user.id} onLoadAnalysis={handleLoadAnalysis} /> : null

      case 'flashcards':
        return analysisId ? (
          <FlashcardsTab analysisId={analysisId} pdfContent={pdfContent} />
        ) : (
          <div className="tab-empty-state">
            <p>{t('pdfAnalyzer.common.emptyStateFlashcards')}</p>
          </div>
        )

      case 'quiz':
        return analysisId ? (
          <QuizTab analysisId={analysisId} pdfContent={pdfContent} userId={user!.id} />
        ) : (
          <div className="tab-empty-state">
            <p>{t('pdfAnalyzer.common.emptyStateQuiz')}</p>
          </div>
        )

      case 'mindmap':
        return analysisId ? (
          <MindMapTab analysisId={analysisId} pdfContent={pdfContent} />
        ) : (
          <div className="tab-empty-state">
            <p>{t('pdfAnalyzer.common.emptyStateMindMap')}</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`pdf-analyzer-modal enhanced ${isMaximized ? 'maximized' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('pdfAnalyzer.title')}</h2>
          <div className="modal-header-actions">
            <button
              className="window-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? t('pdfAnalyzer.common.restore') : t('pdfAnalyzer.common.maximize')}
            >
              {isMaximized ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            {t('pdfAnalyzer.tabs.upload')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
            disabled={!summary}
          >
            {t('pdfAnalyzer.tabs.analysis')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t('pdfAnalyzer.tabs.history')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
            disabled={!analysisId}
          >
            {t('pdfAnalyzer.tabs.flashcards')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
            disabled={!analysisId}
          >
            {t('pdfAnalyzer.tabs.quiz')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'mindmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('mindmap')}
            disabled={!analysisId}
          >
            {t('pdfAnalyzer.tabs.mindMap')}
          </button>
        </div>

        <div className="modal-body">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
