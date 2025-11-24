import { useState, useEffect, useRef } from 'react'
import './StudyTimerModal.css'

interface StudyTimerModalProps {
  onClose: () => void
}

export default function StudyTimerModal({ onClose }: StudyTimerModalProps) {
  const [time, setTime] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'pomodoro' | 'short' | 'long' | 'custom'>('custom')
  const [showCustomInput, setShowCustomInput] = useState(true)
  const [customHours, setCustomHours] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(25)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const durations = {
    pomodoro: 25 * 60, // 25 minutes
    short: 5 * 60,     // 5 minutes
    long: 15 * 60,     // 15 minutes
    custom: (customHours * 60 + customMinutes) * 60
  }

  useEffect(() => {
    // Play notification sound when timer ends
    if (time === 0 && isRunning) {
      playAlarm()
      setIsRunning(false)
      setTimeout(() => {
        alert('⏰ Time\'s up! Great job studying! 🎉')
      }, 100)
    }
  }, [time, isRunning])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => Math.max(0, prevTime - 1))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const playAlarm = () => {
    // Create an alarm sound with multiple beeps
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    const playBeep = (startTime: number, frequency: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.5, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    }
    
    // Play 5 beeps with alternating frequencies
    const now = audioContext.currentTime
    playBeep(now, 800)
    playBeep(now + 0.35, 1000)
    playBeep(now + 0.7, 800)
    playBeep(now + 1.05, 1000)
    playBeep(now + 1.4, 800)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (mode === 'custom' && showCustomInput) {
      // Start with custom time
      const totalSeconds = (customHours * 60 + customMinutes) * 60
      if (totalSeconds === 0) {
        alert('Please enter a valid time!')
        return
      }
      setTime(totalSeconds)
      setShowCustomInput(false)
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    if (mode === 'custom') {
      setShowCustomInput(true)
      setTime((customHours * 60 + customMinutes) * 60)
    } else {
      setTime(durations[mode])
    }
  }

  const handleModeChange = (newMode: 'pomodoro' | 'short' | 'long' | 'custom') => {
    setMode(newMode)
    setIsRunning(false)
    if (newMode === 'custom') {
      setShowCustomInput(true)
      setTime((customHours * 60 + customMinutes) * 60)
    } else {
      setShowCustomInput(false)
      setTime(durations[newMode])
    }
  }

  const progress = ((durations[mode] - time) / durations[mode]) * 100

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content timer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏱️ Study Timer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="timer-modes">
            <button
              className={`mode-btn ${mode === 'custom' ? 'active' : ''}`}
              onClick={() => handleModeChange('custom')}
              disabled={isRunning}
            >
              Custom Time
            </button>
            <button
              className={`mode-btn ${mode === 'pomodoro' ? 'active' : ''}`}
              onClick={() => handleModeChange('pomodoro')}
              disabled={isRunning}
            >
              Pomodoro (25m)
            </button>
            <button
              className={`mode-btn ${mode === 'short' ? 'active' : ''}`}
              onClick={() => handleModeChange('short')}
              disabled={isRunning}
            >
              Short Break (5m)
            </button>
            <button
              className={`mode-btn ${mode === 'long' ? 'active' : ''}`}
              onClick={() => handleModeChange('long')}
              disabled={isRunning}
            >
              Long Break (15m)
            </button>
          </div>

          {mode === 'custom' && showCustomInput && (
            <div className="custom-time-input">
              <h3>Set Your Study Time</h3>
              <div className="time-inputs">
                <div className="time-input-group">
                  <label>Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customHours}
                    onChange={(e) => setCustomHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  />
                </div>
                <span className="time-separator">:</span>
                <div className="time-input-group">
                  <label>Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="timer-display">
            <svg className="timer-circle" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2B124C" />
                  <stop offset="100%" stopColor="#854F6C" />
                </linearGradient>
              </defs>
              <circle
                className="timer-circle-bg"
                cx="100"
                cy="100"
                r="90"
              />
              <circle
                className="timer-circle-progress"
                cx="100"
                cy="100"
                r="90"
                style={{
                  strokeDasharray: `${2 * Math.PI * 90}`,
                  strokeDashoffset: `${2 * Math.PI * 90 * (1 - progress / 100)}`
                }}
              />
            </svg>
            <div className="timer-text">
              <div className="time">{formatTime(time)}</div>
              <div className="timer-label">
                {mode === 'custom' ? 'Study Time' :
                 mode === 'pomodoro' ? 'Focus Time' : 
                 mode === 'short' ? 'Short Break' : 'Long Break'}
              </div>
            </div>
          </div>

          <div className="timer-controls">
            {!isRunning ? (
              <button className="btn-start" onClick={handleStart}>
                {time === durations[mode] ? 'Start' : 'Resume'}
              </button>
            ) : (
              <button className="btn-pause" onClick={handlePause}>
                Pause
              </button>
            )}
            <button className="btn-reset" onClick={handleReset}>
              Reset
            </button>
          </div>

          <div className="timer-tips">
            <p>💡 <strong>Pomodoro Technique:</strong></p>
            <ul>
              <li>Focus for 25 minutes</li>
              <li>Take a 5-minute break</li>
              <li>After 4 pomodoros, take a 15-minute break</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

