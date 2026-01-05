interface AnalysisTabProps {
  summary: string
  explanation: string
  title: string
}

export default function AnalysisTab({ summary, explanation, title }: AnalysisTabProps) {
  const formatText = (text: string) => {
    return text
      .replace(/### (.*?)(\n|$)/g, '<h4 class="section-heading">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<div class="paragraph-break"></div>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '<span class="bullet-point">• </span>')
      .replace(/◦ /g, '<span class="sub-bullet">◦ </span>')
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
              <h4>Summary</h4>
              <div
                className="result-content summary"
                dangerouslySetInnerHTML={{ __html: formatText(summary) }}
              />
            </div>
          )}

          {explanation && (
            <div className="result-section">
              <h4>Detailed Explanation</h4>
              <div
                className="result-content explanation"
                dangerouslySetInnerHTML={{ __html: formatText(explanation) }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="tab-empty-state">
          <p>No analysis available. Please upload and analyze a PDF first.</p>
        </div>
      )}
    </div>
  )
}
