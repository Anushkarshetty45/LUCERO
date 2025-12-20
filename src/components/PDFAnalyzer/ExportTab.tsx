import jsPDF from 'jspdf'
import html2pdf from 'html2pdf.js'
import { saveAs } from 'file-saver'
import { getFlashcards } from '../../services/pdfAnalysisApi'
import { useState } from 'react'

interface ExportTabProps {
  analysisId: string
  title: string
  summary: string
  explanation: string
}

export default function ExportTab({ analysisId, title, summary, explanation }: ExportTabProps) {
  const [exporting, setExporting] = useState(false)

  const exportAsPDF = async () => {
    setExporting(true)
    try {
      const content = `
        <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #333; margin-bottom: 30px;">${title}</h1>

          <h2 style="color: #667eea; margin-top: 30px;">Summary</h2>
          <div style="line-height: 1.8; color: #444;">${summary}</div>

          <h2 style="color: #667eea; margin-top: 30px;">Detailed Explanation</h2>
          <div style="line-height: 1.8; color: #444;">${explanation}</div>

          <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
            Generated with LUCERO PDF Analyzer
          </div>
        </div>
      `

      const element = document.createElement('div')
      element.innerHTML = content

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
      alert('Failed to export as PDF')
    } finally {
      setExporting(false)
    }
  }

  const exportAsWord = () => {
    setExporting(true)
    try {
      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>`
      const content = `
        <body>
          <h1>${title}</h1>

          <h2>Summary</h2>
          <p>${summary}</p>

          <h2>Detailed Explanation</h2>
          <div>${explanation}</div>
        </body>
      `
      const html = `${header}${content}</html>`

      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      })

      saveAs(blob, `${title}_analysis.doc`)
    } catch (err) {
      console.error('Word export error:', err)
      alert('Failed to export as Word')
    } finally {
      setExporting(false)
    }
  }

  const exportAsText = () => {
    setExporting(true)
    try {
      const text = `
${title}
${'='.repeat(title.length)}

SUMMARY
-------
${summary}

DETAILED EXPLANATION
-------------------
${explanation}

---
Generated with LUCERO PDF Analyzer
      `

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, `${title}_analysis.txt`)
    } catch (err) {
      console.error('Text export error:', err)
      alert('Failed to export as text')
    } finally {
      setExporting(false)
    }
  }

  const exportFlashcardsAsCSV = async () => {
    setExporting(true)
    try {
      const flashcards = await getFlashcards(analysisId)

      if (flashcards.length === 0) {
        alert('No flashcards found. Generate flashcards first!')
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
      alert('Failed to export flashcards')
    } finally {
      setExporting(false)
    }
  }

  const exportForAnki = async () => {
    setExporting(true)
    try {
      const flashcards = await getFlashcards(analysisId)

      if (flashcards.length === 0) {
        alert('No flashcards found. Generate flashcards first!')
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
      alert('Failed to export for Anki')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="export-tab">
      <div className="export-header">
        <h3>💾 Export Analysis</h3>
        <p>Download your analysis in various formats</p>
      </div>

      <div className="export-sections">
        <div className="export-section">
          <h4>📄 Analysis Document</h4>
          <p>Export the complete analysis with summary and explanation</p>
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={exportAsPDF}
              disabled={exporting}
            >
              📕 Export as PDF
            </button>
            <button
              className="export-btn"
              onClick={exportAsWord}
              disabled={exporting}
            >
              📘 Export as Word
            </button>
            <button
              className="export-btn"
              onClick={exportAsText}
              disabled={exporting}
            >
              📄 Export as Text
            </button>
          </div>
        </div>

        <div className="export-section">
          <h4>🎴 Flashcards</h4>
          <p>Export flashcards for use in other study tools</p>
          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={exportFlashcardsAsCSV}
              disabled={exporting}
            >
              📊 Export as CSV
            </button>
            <button
              className="export-btn"
              onClick={exportForAnki}
              disabled={exporting}
            >
              🎴 Export for Anki
            </button>
          </div>
        </div>

        <div className="export-info">
          <h4>ℹ️ Export Information</h4>
          <ul>
            <li><strong>PDF</strong>: Best for printing and sharing</li>
            <li><strong>Word</strong>: Best for editing and customization</li>
            <li><strong>Text</strong>: Simple, lightweight format</li>
            <li><strong>CSV</strong>: Compatible with Excel, Google Sheets, and Quizlet</li>
            <li><strong>Anki</strong>: Import directly into Anki for spaced repetition</li>
          </ul>
        </div>
      </div>

      {exporting && (
        <div className="export-progress">
          <div className="spinner"></div>
          <p>Exporting...</p>
        </div>
      )}
    </div>
  )
}
