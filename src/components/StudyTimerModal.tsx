import { useState, useEffect, useRef } from 'react'
import './StudyTimerModal.css'

interface StudyTimerModalProps {
  onClose: () => void
}

export default function StudyTimerModal({ onClose }: StudyTimerModalProps) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(25)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0) // in seconds
  const [totalTime, setTotalTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Countdown logic
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            playAlarm()
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, timeRemaining])

  const playAlarm = () => {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext

    // Play alarm sound for 3 seconds
    const duration = 3
    const beepCount = 6
    const beepDuration = 0.2

    for (let i = 0; i < beepCount; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800 // Hz
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + beepDuration)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + beepDuration)
      }, i * 500)
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Timer Complete!', {
        body: 'Your study session is complete. Time for a break!',
        icon: '/favicon.ico'
      })
    }
  }

  const handleStart = () => {
    const totalSeconds = hours * 3600 + minutes * 60
    if (totalSeconds === 0) {
      alert('Please set a time greater than 0')
      return
    }

    setTimeRemaining(totalSeconds)
    setTotalTime(totalSeconds)
    setIsRunning(true)
    setIsPaused(false)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeRemaining(0)
    setTotalTime(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content timer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏱️ Study Timer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!isRunning ? (
            <>
              <h3 style={{ textAlign: 'center', marginBottom: '30px', color: '#2B124C' }}>
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
                  {formatTime(timeRemaining)}
                </div>
              </div>

              <div className="timer-controls">
                <button
                  onClick={handlePause}
                  className="timer-btn timer-btn-pause"
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <button
                  onClick={handleReset}
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
