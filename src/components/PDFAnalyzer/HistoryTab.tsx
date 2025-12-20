import { useState, useEffect } from 'react'
import { getUserPDFAnalyses, deletePDFAnalysis } from '../../services/pdfAnalysisApi'
import type { PDFAnalysis } from '../../types/pdfAnalysis'

interface HistoryTabProps {
  userId: string
  onLoadAnalysis: (analysisId: string, data: any) => void
}

export default function HistoryTab({ userId, onLoadAnalysis }: HistoryTabProps) {
  const [analyses, setAnalyses] = useState<PDFAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [userId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await getUserPDFAnalyses(userId)
      setAnalyses(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (analysisId: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return

    try {
      await deletePDFAnalysis(analysisId)
      setAnalyses(prev => prev.filter(a => a.id !== analysisId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="tab-loading">
        <div className="spinner"></div>
        <p>Loading history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tab-error">
        <p>⚠️ {error}</p>
        <button onClick={loadHistory}>Retry</button>
      </div>
    )
  }

  return (
    <div className="history-tab">
      <div className="history-header">
        <h3>📚 Your PDF Analyses</h3>
        <span className="history-count">{analyses.length} total</span>
      </div>

      {analyses.length === 0 ? (
        <div className="tab-empty-state">
          <div className="empty-icon">📄</div>
          <p>No PDF analyses yet</p>
          <p className="empty-subtitle">Upload and analyze your first PDF to get started!</p>
        </div>
      ) : (
        <div className="history-list">
          {analyses.map(analysis => (
            <div key={analysis.id} className="history-item">
              <div className="history-item-header">
                <div className="history-item-title">
                  <span className="history-icon">📄</span>
                  <h4>{analysis.title}</h4>
                </div>
                <div className="history-item-actions">
                  <button
                    className="btn-load"
                    onClick={() => onLoadAnalysis(analysis.id, analysis)}
                    title="Load this analysis"
                  >
                    📖 View
                  </button>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete(analysis.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="history-item-meta">
                <span className="meta-item">
                  📅 {formatDate(analysis.created_at)}
                </span>
                <span className="meta-item">
                  📄 {analysis.page_count} pages
                </span>
                {analysis.course && (
                  <span className="meta-item" style={{ color: analysis.course.color }}>
                    📚 {analysis.course.title}
                  </span>
                )}
              </div>

              <div className="history-item-summary">
                {analysis.summary.substring(0, 150)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
