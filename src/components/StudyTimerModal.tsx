import { useState, useEffect, useRef } from 'react'
import './StudyTimerModal.css'

interface StudyTimerModalProps {
  onClose: () => void
}

export default function StudyTimerModal({ onClose }: StudyTimerModalProps) {
  const [time, setTime] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'pomodoro' | 'short' | 'long'>('pomodoro')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const durations = {
    pomodoro: 25 * 60, // 25 minutes
    short: 5 * 60,     // 5 minutes
    long: 15 * 60      // 15 minutes
  }

  useEffect(() => {
    // Play notification sound when timer ends
    if (time === 0 && isRunning) {
      playNotification()
      setIsRunning(false)
      alert('⏰ Time\'s up! Take a break! 🎉')
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

  const playNotification = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(durations[mode])
  }

  const handleModeChange = (newMode: 'pomodoro' | 'short' | 'long') => {
    setMode(newMode)
    setTime(durations[newMode])
    setIsRunning(false)
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
                {mode === 'pomodoro' ? 'Focus Time' : 
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

