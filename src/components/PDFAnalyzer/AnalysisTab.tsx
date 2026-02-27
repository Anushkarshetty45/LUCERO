import { useTranslation } from 'react-i18next'
import { sanitizeHTML } from '../../utils/security'

interface AnalysisTabProps {
  summary: string
  explanation: string
  title: string
}

export default function AnalysisTab({ summary, explanation, title }: AnalysisTabProps) {
  const { t } = useTranslation()
  const formatText = (text: string) => {
    const formatted = text
      .replace(/### (.*?)(\n|$)/g, '<h4 class="section-heading">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<div class="paragraph-break"></div>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '<span class="bullet-point">• </span>')
      .replace(/◦ /g, '<span class="sub-bullet">◦ </span>')

    // Sanitize to prevent XSS attacks
    return sanitizeHTML(formatted)
  }

  return (
    <div className="analysis-tab">
      {summary || explanation ? (
        <div className="results-section">
          <div className="results-header">
            <h3>{title}</h3>
          </div>

          {summary && (
            <div className="result-section">
              <h4>{t('pdfAnalyzer.analysis.summary')}</h4>
              <div
                className="result-content summary"
                dangerouslySetInnerHTML={{ __html: formatText(summary) }}
              />
            </div>
          )}

          {explanation && (
            <div className="result-section">
              <h4>{t('pdfAnalyzer.analysis.detailedExplanation')}</h4>
              <div
                className="result-content explanation"
                dangerouslySetInnerHTML={{ __html: formatText(explanation) }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="tab-empty-state">
          <p>{t('pdfAnalyzer.analysis.noAnalysis')}</p>
        </div>
      )}
    </div>
  )
}
