import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserPDFAnalyses, deletePDFAnalysis } from '../../services/pdfAnalysisApi'
import type { PDFAnalysis } from '../../types/pdfAnalysis'

interface HistoryTabProps {
  userId: string
  onLoadAnalysis: (analysisId: string, data: any) => void
}

export default function HistoryTab({ userId, onLoadAnalysis }: HistoryTabProps) {
  const { t } = useTranslation()
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
    if (!window.confirm(t('pdfAnalyzer.history.deleteConfirm'))) return

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
        <p>{t('pdfAnalyzer.history.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tab-error">
        <p>{error}</p>
        <button onClick={loadHistory}>{t('pdfAnalyzer.history.retry')}</button>
      </div>
    )
  }

  return (
    <div className="history-tab">
      <div className="history-header">
        <h3>{t('pdfAnalyzer.history.title')}</h3>
        <span className="history-count">{t('pdfAnalyzer.history.totalCount', { count: analyses.length })}</span>
      </div>

      {analyses.length === 0 ? (
        <div className="tab-empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p>{t('pdfAnalyzer.history.noAnalyses')}</p>
          <p className="empty-subtitle">{t('pdfAnalyzer.history.getStarted')}</p>
        </div>
      ) : (
        <div className="history-list">
          {analyses.map(analysis => (
            <div key={analysis.id} className="history-item">
              <div className="history-item-header">
                <div className="history-item-title">
                  <h4>{analysis.title}</h4>
                </div>
                <div className="history-item-actions">
                  <button
                    className="btn-load"
                    onClick={() => onLoadAnalysis(analysis.id, analysis)}
                    title={t('pdfAnalyzer.history.loadTitle')}
                  >
                    {t('pdfAnalyzer.history.view')}
                  </button>
                  <button
                    className="btn-delete-small"
                    onClick={() => handleDelete(analysis.id)}
                    title={t('pdfAnalyzer.history.deleteTitle')}
                  >
                    {t('pdfAnalyzer.history.delete')}
                  </button>
                </div>
              </div>

              <div className="history-item-meta">
                <span className="meta-item">
                  {formatDate(analysis.created_at)}
                </span>
                <span className="meta-item">
                  {t('pdfAnalyzer.history.pages', { count: analysis.page_count })}
                </span>
                {analysis.course && (
                  <span className="meta-item" style={{ color: analysis.course.color }}>
                    {analysis.course.title}
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
