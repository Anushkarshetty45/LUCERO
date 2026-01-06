import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import * as pdfjsLib from 'pdfjs-dist'
import { uploadPDFToStorage, createPDFAnalysis } from '../../services/pdfAnalysisApi'
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
  const { user } = useAuth()
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
      setTitle(selectedFile.name.replace('.pdf', ''))
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
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
      throw new Error('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to your .env file')
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
      throw new Error(error.error?.message || 'Failed to analyze PDF')
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

    setExtracting(true)
    setAnalyzing(false)
    setError('')
    setProgress(0)

    try {
      // Extract text from PDF
      const text = await extractTextFromPDF(file)

      if (!text.trim()) {
        throw new Error('No text could be extracted from the PDF')
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

      // Auto-navigate to Analysis tab after successful analysis
      setActiveTab('analysis')

    } catch (err: any) {
      console.error('PDF Analysis Error:', err)
      setError(err.message || 'Failed to analyze PDF')
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
              <h3>Upload a PDF Document</h3>
              <p>Upload any PDF file and I'll analyze, summarize, and create study materials!</p>

              <button
                className="btn-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting || analyzing}
              >
                {file ? file.name : 'Choose PDF File'}
              </button>

              {file && (
                <div className="file-info">
                  <input
                    type="text"
                    className="title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Analysis title..."
                  />
                </div>
              )}
            </div>

            {file && !extracting && !analyzing && (
              <div className="file-actions">
                <button className="btn-analyze" onClick={handleAnalyze}>
                  Analyze PDF
                </button>
                <button className="btn-remove" onClick={() => setFile(null)}>
                  Remove
                </button>
              </div>
            )}

            {(extracting || analyzing) && (
              <div className="processing-status">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p>
                  {extracting && 'Extracting text from PDF...'}
                  {analyzing && 'Analyzing with AI...'}
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
            <p>Please analyze a PDF first to generate flashcards!</p>
          </div>
        )

      case 'quiz':
        return analysisId ? (
          <QuizTab analysisId={analysisId} pdfContent={pdfContent} userId={user!.id} />
        ) : (
          <div className="tab-empty-state">
            <p>Please analyze a PDF first to generate a quiz!</p>
          </div>
        )

      case 'mindmap':
        return analysisId ? (
          <MindMapTab analysisId={analysisId} pdfContent={pdfContent} />
        ) : (
          <div className="tab-empty-state">
            <p>Please analyze a PDF first to generate a mind map!</p>
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
          <h2>PDF Analyzer</h2>
          <div className="modal-header-actions">
            <button
              className="window-btn"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Restore' : 'Maximize'}
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
            Upload
          </button>
          <button
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
            disabled={!summary}
          >
            Analysis
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button
            className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
            disabled={!analysisId}
          >
            Flashcards
          </button>
          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
            disabled={!analysisId}
          >
            Quiz
          </button>
          <button
            className={`tab-btn ${activeTab === 'mindmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('mindmap')}
            disabled={!analysisId}
          >
            Mind Map
          </button>
        </div>

        <div className="modal-body">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
