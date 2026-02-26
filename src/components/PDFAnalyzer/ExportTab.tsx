import jsPDF from 'jspdf'
import html2pdf from 'html2pdf.js'
import { saveAs } from 'file-saver'
import { useTranslation } from 'react-i18next'
import { getFlashcards } from '../../services/pdfAnalysisApi'
import { useState } from 'react'
import { sanitizeHTML, stripHTML } from '../../utils/security'

interface ExportTabProps {
  analysisId: string
  title: string
  summary: string
  explanation: string
}

export default function ExportTab({ analysisId, title, summary, explanation }: ExportTabProps) {
  const { t } = useTranslation()
  const [exporting, setExporting] = useState(false)

  const exportAsPDF = async () => {
    setExporting(true)
    try {
      // Sanitize all user-provided content to prevent XSS
      const sanitizedTitle = stripHTML(title)
      const sanitizedSummary = sanitizeHTML(summary)
      const sanitizedExplanation = sanitizeHTML(explanation)

      const content = `
        <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333; margin-bottom: 30px;">${sanitizedTitle}</h1>

          <h2 style="color: #667eea; margin-top: 30px;">Summary</h2>
          <div style="line-height: 1.8; color: #444;">${sanitizedSummary}</div>

          <h2 style="color: #667eea; margin-top: 30px;">Detailed Explanation</h2>
          <div style="line-height: 1.8; color: #444;">${sanitizedExplanation}</div>

          <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
            Generated with LUCERO PDF Analyzer
          </div>
        </div>
      `

      const element = document.createElement('div')
      element.innerHTML = sanitizeHTML(content)

      html2pdf()
        .from(element)
        .set({
          margin: [10, 10, 10, 10],
          filename: `${title}_analysis.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        })
        .save()
    } catch (err) {
      console.error('PDF export error:', err)
      alert(t('pdfAnalyzer.export.errorPDF'))
    } finally {
      setExporting(false)
    }
  }

  const exportAsWord = () => {
    setExporting(true)
    try {
      // Sanitize all user-provided content to prevent XSS
      const sanitizedTitle = stripHTML(title)
      const sanitizedSummary = sanitizeHTML(summary)
      const sanitizedExplanation = sanitizeHTML(explanation)

      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>`
      const content = `
        <body>
          <h1>${sanitizedTitle}</h1>

          <h2>Summary</h2>
          <p>${sanitizedSummary}</p>

          <h2>Detailed Explanation</h2>
          <div>${sanitizedExplanation}</div>
        </body>
      `
      const html = `${header}${content}</html>`

      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      })

      saveAs(blob, `${title}_analysis.doc`)
    } catch (err) {
      console.error('Word export error:', err)
      alert(t('pdfAnalyzer.export.errorWord'))
    } finally {
      setExporting(false)
    }
  }

  const exportAsText = () => {
    setExporting(true)
    try{
      // Strip all HTML tags for plain text export
      const plainTitle = stripHTML(title)
      const plainSummary = stripHTML(summary)
      const plainExplanation = stripHTML(explanation)

      const text = `
${plainTitle}
${'='.repeat(plainTitle.length)}

SUMMARY
-------
${plainSummary}

DETAILED EXPLANATION
-------------------
${plainExplanation}

---
Generated with LUCERO PDF Analyzer
      `

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, `${title}_analysis.txt`)
    } catch (err) {
      console.error('Text export error:', err)
      alert(t('pdfAnalyzer.export.errorText'))
    } finally {
      setExporting(false)
    }
  }

  const exportFlashcardsAsCSV = async () => {
    setExporting(true)
    try {
      const flashcards = await getFlashcards(analysisId)

      if (flashcards.length === 0) {
        alert(t('pdfAnalyzer.export.noFlashcards'))
        return
      }

      const csv = [
        ['Front', 'Back', 'Category'],
        ...flashcards.map(card => [
          `"${card.front.replace(/"/g, '""')}"`,
          `"${card.back.replace(/"/g, '""')}"`,
          card.category
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, `${title}_flashcards.csv`)
    } catch (err) {
      console.error('Flashcard export error:', err)
      alert(t('pdfAnalyzer.export.errorFlashcards'))
    } finally {
      setExporting(false)
    }
  }

  const exportForAnki = async () => {
    setExporting(true)
    try {
      const flashcards = await getFlashcards(analysisId)

      if (flashcards.length === 0) {
        alert(t('pdfAnalyzer.export.noFlashcards'))
        return
      }

      // Anki format: Front; Back; Tags
      const ankiData = flashcards
        .map(card => `${card.front.replace(/;/g, ',')};${card.back.replace(/;/g, ',')};${card.category}`)
        .join('\n')

      const blob = new Blob([ankiData], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, `${title}_anki.txt`)
    } catch (err) {
      console.error('Anki export error:', err)
      alert(t('pdfAnalyzer.export.errorAnki'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="export-tab">
      <div className="export-header">
        <h3>{t('pdfAnalyzer.export.title')}</h3>
        <p>{t('pdfAnalyzer.export.description')}</p>
      </div>

      <div className="export-sections">
        <div className="export-section">
          <h4>{t('pdfAnalyzer.export.analysisDocument')}</h4>
          <p>{t('pdfAnalyzer.export.analysisDocumentDesc')}</p>
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={exportAsPDF}
              disabled={exporting}
            >
              {t('pdfAnalyzer.export.exportPDF')}
            </button>
            <button
              className="export-btn"
              onClick={exportAsWord}
              disabled={exporting}
            >
              {t('pdfAnalyzer.export.exportWord')}
            </button>
            <button
              className="export-btn"
              onClick={exportAsText}
              disabled={exporting}
            >
              {t('pdfAnalyzer.export.exportText')}
            </button>
          </div>
        </div>

        <div className="export-section">
          <h4>{t('pdfAnalyzer.export.flashcardsSection')}</h4>
          <p>{t('pdfAnalyzer.export.flashcardsSectionDesc')}</p>
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={exportFlashcardsAsCSV}
              disabled={exporting}
            >
              {t('pdfAnalyzer.export.exportCSV')}
            </button>
            <button
              className="export-btn"
              onClick={exportForAnki}
              disabled={exporting}
            >
              {t('pdfAnalyzer.export.exportAnki')}
            </button>
          </div>
        </div>

        <div className="export-info">
          <h4>{t('pdfAnalyzer.export.infoTitle')}</h4>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: sanitizeHTML(t('pdfAnalyzer.export.infoPDF')) }} />
            <li dangerouslySetInnerHTML={{ __html: sanitizeHTML(t('pdfAnalyzer.export.infoWord')) }} />
            <li dangerouslySetInnerHTML={{ __html: sanitizeHTML(t('pdfAnalyzer.export.infoText')) }} />
            <li dangerouslySetInnerHTML={{ __html: sanitizeHTML(t('pdfAnalyzer.export.infoCSV')) }} />
            <li dangerouslySetInnerHTML={{ __html: sanitizeHTML(t('pdfAnalyzer.export.infoAnki')) }} />
          </ul>
        </div>
      </div>

      {exporting && (
        <div className="export-progress">
          <div className="spinner"></div>
          <p>{t('pdfAnalyzer.export.exporting')}</p>
        </div>
      )}
    </div>
  )
}
