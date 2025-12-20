import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import './PDFAnalyzerModal.css'

// Set up PDF.js worker - use local file for reliability (updated)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFAnalyzerModalProps {
  onClose: () => void
}

export default function PDFAnalyzerModal({ onClose }: PDFAnalyzerModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [summary, setSummary] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
      setSummary('')
      setExplanation('')
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const numPages = pdf.numPages
    let fullText = ''

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      setProgress(Math.round((pageNum / numPages) * 50)) // 0-50% for extraction
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
      throw new Error('Gemini API key not found')
    }

    // Truncate if text is too long (Gemini has token limits)
    const maxLength = 30000
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text

    const prompt = `You are a helpful AI assistant that analyzes documents. I have extracted text from a PDF document. Please provide a well-organized analysis.

Here is the document text:

${truncatedText}

Please format your response EXACTLY as follows:

## SUMMARY

Write 2-3 clear, well-structured paragraphs summarizing the main points of the document.

Use proper paragraph spacing (double line breaks between paragraphs).

## EXPLANATION

### Key Topics

• **Topic 1**: Explanation here
  ◦ Sub-point with details
  ◦ Another sub-point

• **Topic 2**: Explanation here
  ◦ Sub-point with details
  ◦ Another sub-point

### Important Concepts

• **Concept 1**: Clear explanation
  ◦ Supporting detail
  ◦ Example or clarification

• **Concept 2**: Clear explanation
  ◦ Supporting detail
  ◦ Example or clarification

### Main Takeaways

• Key point 1
• Key point 2
• Key point 3

FORMATTING RULES:
- Use **bold** for important terms and headings
- Use bullet points (•) for main points
- Use sub-bullets (◦) for supporting details
- Add blank lines between sections for readability
- Keep explanations clear and concise
- Organize content with proper headings (###)`

    setProgress(60)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
            maxOutputTokens: 4096,
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

    // Parse the response to extract summary and explanation
    const summaryMatch = aiResponse.match(/## SUMMARY\s*([\s\S]*?)(?=## EXPLANATION|$)/i)
    const explanationMatch = aiResponse.match(/## EXPLANATION\s*([\s\S]*?)$/i)

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : aiResponse.split('\n\n')[0],
      explanation: explanationMatch ? explanationMatch[1].trim() : aiResponse
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

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

      setExtracting(false)
      setAnalyzing(true)
      setProgress(50)

      // Analyze with AI
      const result = await analyzeWithAI(text)
      setSummary(result.summary)
      setExplanation(result.explanation)
      setProgress(100)
      setAnalyzing(false)

    } catch (err: any) {
      console.error('PDF Analysis Error:', err)
      setError(err.message || 'Failed to analyze PDF')
      setExtracting(false)
      setAnalyzing(false)
      setProgress(0)
    }
  }

  const formatText = (text: string) => {
    return text
      // Convert headings (###) to styled headings
      .replace(/### (.*?)(\n|$)/g, '<h4 class="section-heading">$1</h4>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Add extra spacing for double line breaks (paragraphs)
      .replace(/\n\n/g, '<div class="paragraph-break"></div>')
      // Convert single line breaks to <br/>
      .replace(/\n/g, '<br/>')
      // Format bullet points with proper spacing
      .replace(/• /g, '<span class="bullet-point">• </span>')
      // Format sub-bullets with indentation
      .replace(/◦ /g, '<span class="sub-bullet">◦ </span>')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pdf-analyzer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📄 PDF Analyzer</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!summary && !explanation && (
            <div className="upload-section">
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">📄</div>
                <h3>Upload a PDF Document</h3>
                <p>Upload any PDF file and I'll explain and summarize it for you!</p>
                <button
                  className="btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extracting || analyzing}
                >
                  {file ? '📎 ' + file.name : 'Choose PDF File'}
                </button>
              </div>

              {file && !extracting && !analyzing && (
                <div className="file-actions">
                  <button className="btn-analyze" onClick={handleAnalyze}>
                    ✨ Analyze PDF
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
                    {extracting && '📖 Extracting text from PDF...'}
                    {analyzing && '🤖 Analyzing with AI...'}
                  </p>
                  <span className="progress-text">{progress}%</span>
                </div>
              )}

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          {(summary || explanation) && (
            <div className="results-section">
              <div className="results-header">
                <h3>📄 {file?.name}</h3>
                <button className="btn-new-analysis" onClick={() => {
                  setFile(null)
                  setSummary('')
                  setExplanation('')
                  setError('')
                  setProgress(0)
                }}>
                  ⬆️ Analyze Another PDF
                </button>
              </div>

              {summary && (
                <div className="result-section">
                  <h4>📝 Summary</h4>
                  <div
                    className="result-content summary"
                    dangerouslySetInnerHTML={{ __html: formatText(summary) }}
                  />
                </div>
              )}

              {explanation && (
                <div className="result-section">
                  <h4>💡 Detailed Explanation</h4>
                  <div
                    className="result-content explanation"
                    dangerouslySetInnerHTML={{ __html: formatText(explanation) }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
