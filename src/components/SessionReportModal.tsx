import { useTranslation } from 'react-i18next'
import { IoClose, IoFlame, IoTrophy, IoCheckmarkCircle, IoWarning, IoTimer, IoEye } from 'react-icons/io5'
import './SessionReportModal.css'

interface SessionAnalytics {
  focusScore: number
  totalFocusedTime: number
  totalDistractedTime: number
  distractionCount: number
  longestFocusStreak: number
  averageFocusStreak: number
  focusTimeline: Array<{ timestamp: number; type: string; duration: number }>
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  rarity: string
}

interface SessionReportModalProps {
  analytics: SessionAnalytics
  achievements: Achievement[]
  sessionDuration: number
  onClose: () => void
}

export default function SessionReportModal({
  analytics,
  achievements,
  sessionDuration,
  onClose
}: SessionReportModalProps) {
  const { t } = useTranslation()

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return t('sessionReport.timeFormat.hoursMinsSecs', { hours, mins, secs })
    }
    return t('sessionReport.timeFormat.minsSecs', { mins, secs })
  }

  const getFocusQuality = (score: number) => {
    if (score >= 90) return { label: t('sessionReport.quality.excellent'), color: '#10b981', emoji: '🌟' }
    if (score >= 75) return { label: t('sessionReport.quality.great'), color: '#3b82f6', emoji: '😊' }
    if (score >= 60) return { label: t('sessionReport.quality.good'), color: '#8b5cf6', emoji: '👍' }
    if (score >= 45) return { label: t('sessionReport.quality.fair'), color: '#f59e0b', emoji: '😐' }
    return { label: t('sessionReport.quality.needsImprovement'), color: '#ef4444', emoji: '😕' }
  }

  const getInsights = () => {
    const insights = []

    if (analytics.focusScore >= 85) {
      insights.push({
        type: 'positive',
        message: t('sessionReport.insights.outstandingFocus')
      })
    }

    if (analytics.longestFocusStreak >= 1800) {
      insights.push({
        type: 'positive',
        message: t('sessionReport.insights.impressiveStreak', { time: formatTime(analytics.longestFocusStreak) })
      })
    }

    if (analytics.distractionCount > 5) {
      insights.push({
        type: 'improvement',
        message: t('sessionReport.insights.minimizeDistractions')
      })
    }

    if (analytics.averageFocusStreak < 600) {
      insights.push({
        type: 'improvement',
        message: t('sessionReport.insights.pomodoroTechnique')
      })
    }

    return insights
  }

  const quality = getFocusQuality(analytics.focusScore)
  const insights = getInsights()
  const focusPercentage = ((analytics.totalFocusedTime / sessionDuration) * 100).toFixed(1)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="session-report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose}>
          <IoClose />
        </button>

        {/* Header */}
        <div className="report-header">
          <h2>{t('sessionReport.sessionComplete', { emoji: quality.emoji })}</h2>
          <p>{t('sessionReport.hereIsHow')}</p>
        </div>

        {/* Main Focus Score */}
        <div className="focus-score-display">
          <div className="score-circle" style={{ borderColor: quality.color }}>
            <div className="score-inner">
              <div className="score-number" style={{ color: quality.color }}>
                {analytics.focusScore}
              </div>
              <div className="score-percent">%</div>
            </div>
          </div>
          <div className="score-quality">
            <h3 style={{ color: quality.color }}>{quality.label}</h3>
            <p>{t('sessionReport.focusScore')}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <IoCheckmarkCircle />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatTime(analytics.totalFocusedTime)}</div>
              <div className="stat-label">{t('sessionReport.stats.focusedTime')}</div>
              <div className="stat-sublabel">{t('sessionReport.stats.percentOfSession', { percent: focusPercentage })}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <IoFlame />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatTime(analytics.longestFocusStreak)}</div>
              <div className="stat-label">{t('sessionReport.stats.bestStreak')}</div>
              <div className="stat-sublabel">{t('sessionReport.stats.personalRecord')}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <IoTimer />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatTime(analytics.averageFocusStreak)}</div>
              <div className="stat-label">{t('sessionReport.stats.avgStreak')}</div>
              <div className="stat-sublabel">{t('sessionReport.stats.perFocusPeriod')}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <IoWarning />
            </div>
            <div className="stat-content">
              <div className="stat-value">{analytics.distractionCount}</div>
              <div className="stat-label">{t('sessionReport.stats.distractions')}</div>
              <div className="stat-sublabel">{t('sessionReport.stats.timesLostFocus')}</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="achievements-section">
            <h3><IoTrophy /> {t('sessionReport.achievementsUnlocked')}</h3>
            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`achievement-card rarity-${achievement.rarity}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <div className="achievement-name">{achievement.name}</div>
                    <div className="achievement-desc">{achievement.description}</div>
                    <div className="achievement-points">+{achievement.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="insights-section">
            <h3><IoEye /> {t('sessionReport.insightsRecommendations')}</h3>
            <div className="insights-list">
              {insights.map((insight, index) => (
                <div key={index} className={`insight-item insight-${insight.type}`}>
                  <div className="insight-icon">
                    {insight.type === 'positive' ? '✅' : '💡'}
                  </div>
                  <p>{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button className="btn-continue" onClick={onClose}>
          {t('sessionReport.continueLearning')}
        </button>
      </div>
    </div>
  )
}
