import { useEffect, useState } from 'react'
import { IoFlame, IoEye, IoCheckmarkCircle, IoWarning } from 'react-icons/io5'
import './FocusMetricsOverlay.css'

interface FocusMetrics {
  focusScore: number
  currentStreak: number
  longestStreak: number
  distractionCount: number
  totalFocusTime: number
  isFocused: boolean
}

interface FocusMetricsOverlayProps {
  metrics: FocusMetrics
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export default function FocusMetricsOverlay({
  metrics,
  isMinimized = false,
  onToggleMinimize
}: FocusMetricsOverlayProps) {
  const [pulseStreak, setPulseStreak] = useState(false)

  // Pulse animation when streak increases
  useEffect(() => {
    if (metrics.currentStreak > 0 && metrics.currentStreak % 60 === 0) {
      setPulseStreak(true)
      setTimeout(() => setPulseStreak(false), 1000)
    }
  }, [metrics.currentStreak])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getFocusQuality = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: '#10b981', icon: <IoCheckmarkCircle /> }
    if (score >= 75) return { label: 'Good', color: '#3b82f6', icon: <IoEye /> }
    if (score >= 50) return { label: 'Fair', color: '#f59e0b', icon: <IoWarning /> }
    return { label: 'Needs Focus', color: '#ef4444', icon: <IoWarning /> }
  }

  const quality = getFocusQuality(metrics.focusScore)

  if (isMinimized) {
    return (
      <div className="focus-overlay-minimized" onClick={onToggleMinimize}>
        <div
          className="focus-score-mini"
          style={{ borderColor: quality.color }}
        >
          {metrics.focusScore}%
        </div>
        <div className="focus-status-mini" style={{ color: quality.color }}>
          {metrics.isFocused ? '👀 Focused' : '⚠️ Away'}
        </div>
      </div>
    )
  }

  return (
    <div className="focus-metrics-overlay">
      <div className="focus-overlay-header">
        <h3>Focus Metrics</h3>
        {onToggleMinimize && (
          <button onClick={onToggleMinimize} className="btn-minimize">
            _
          </button>
        )}
      </div>

      {/* Main Focus Score */}
      <div className="focus-score-section">
        <div className="focus-score-circle-container">
          <svg className="focus-score-circle" viewBox="0 0 120 120">
            <circle
              className="score-bg"
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              className="score-progress"
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={quality.color}
              strokeWidth="8"
              strokeDasharray={`${(metrics.focusScore / 100) * 314} 314`}
              strokeDashoffset="0"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="score-value">
            <div className="score-number">{metrics.focusScore}%</div>
            <div className="score-label" style={{ color: quality.color }}>
              {quality.icon} {quality.label}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {/* Current Streak */}
        <div className={`metric-card ${pulseStreak ? 'pulse' : ''}`}>
          <div className="metric-icon streak-icon">
            <IoFlame />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatTime(metrics.currentStreak)}</div>
            <div className="metric-label">Current Streak</div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="metric-card">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <div className="metric-value">{formatTime(metrics.longestStreak)}</div>
            <div className="metric-label">Best Streak</div>
          </div>
        </div>

        {/* Distractions */}
        <div className="metric-card">
          <div className="metric-icon distraction-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.distractionCount}</div>
            <div className="metric-label">Distractions</div>
          </div>
        </div>

        {/* Total Focus Time */}
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{formatTime(metrics.totalFocusTime)}</div>
            <div className="metric-label">Focus Time</div>
          </div>
        </div>
      </div>

      {/* Focus Status Indicator */}
      <div className={`focus-status ${metrics.isFocused ? 'focused' : 'distracted'}`}>
        <div className="status-dot"></div>
        <span>{metrics.isFocused ? 'You are focused' : 'Focus needed'}</span>
      </div>
    </div>
  )
}
