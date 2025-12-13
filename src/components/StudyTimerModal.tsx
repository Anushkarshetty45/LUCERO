import { useState } from 'react'
import './StudyTimerModal.css'

interface TimerHook {
  isRunning: boolean
  isPaused: boolean
  timeRemaining: number
  totalTime: number
  startTimer: (hours: number, minutes: number) => boolean
  pauseTimer: () => void
  resetTimer: () => void
}

interface StudyTimerModalProps {
  onClose: () => void
  onMinimize: () => void
  timer: TimerHook
}

export default function StudyTimerModal({ onClose, onMinimize, timer }: StudyTimerModalProps) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(25)

  const handleStart = () => {
    const success = timer.startTimer(hours, minutes)
    if (!success) {
      alert('Please set a time greater than 0')
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = timer.totalTime > 0 ? ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100 : 0

  const handleMinimize = () => {
    if (timer.isRunning) {
      onMinimize()
    }
  }

  const handleClose = () => {
    // Stop timer when closing
    timer.resetTimer()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content timer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏱️ Study Timer</h2>
          <div className="modal-header-buttons">
            {timer.isRunning && (
              <button
                className="minimize-btn"
                onClick={handleMinimize}
                title="Minimize"
              >
                −
              </button>
            )}
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          {!timer.isRunning ? (
            <>
              <h3 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
                Set Your Study Time
              </h3>

              <div className="time-inputs">
                <div className="time-input-group">
                  <label>Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  />
                </div>

                <span className="time-separator">:</span>

                <div className="time-input-group">
                  <label>Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                </div>
              </div>

              <button
                onClick={handleStart}
                className="timer-btn timer-btn-start"
              >
                Start Timer
              </button>
            </>
          ) : (
            <>
              <div className="timer-display-container">
                <svg className="timer-progress-ring" width="200" height="200">
                  <circle
                    className="timer-progress-ring-bg"
                    cx="100"
                    cy="100"
                    r="90"
                  />
                  <circle
                    className="timer-progress-ring-progress"
                    cx="100"
                    cy="100"
                    r="90"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 90}`,
                      strokeDashoffset: `${2 * Math.PI * 90 * (1 - progress / 100)}`
                    }}
                  />
                </svg>
                <div className="timer-display">
                  {formatTime(timer.timeRemaining)}
                </div>
              </div>

              <div className="timer-controls">
                <button
                  onClick={timer.pauseTimer}
                  className="timer-btn timer-btn-pause"
                >
                  {timer.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <button
                  onClick={timer.resetTimer}
                  className="timer-btn timer-btn-reset"
                >
                  🔄 Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
