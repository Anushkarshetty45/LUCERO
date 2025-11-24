import { useState, useEffect, useRef } from 'react'
import './StudyTimerModal.css'

interface StudyTimerModalProps {
  onClose: () => void
}

export default function StudyTimerModal({ onClose }: StudyTimerModalProps) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(25)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            playAlarm()
            alert('⏰ Time\'s up! Great job studying! 🎉')
            return 0
          }
          return prev - 1
        })
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
  }, [isRunning, timeLeft])

  const playAlarm = () => {
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
    
    const now = audioContext.currentTime
    playBeep(now, 800)
    playBeep(now + 0.35, 1000)
    playBeep(now + 0.7, 800)
    playBeep(now + 1.05, 1000)
    playBeep(now + 1.4, 800)
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    const totalSeconds = (hours * 3600) + (minutes * 60)
    if (totalSeconds === 0) {
      alert('Please enter a valid time!')
      return
    }
    setTimeLeft(totalSeconds)
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(0)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content timer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏱️ Study Timer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!isRunning && timeLeft === 0 ? (
            <>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Set Your Study Time</h3>
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
                className="btn-start" 
                onClick={handleStart}
                style={{ 
                  width: '100%', 
                  marginTop: '30px',
                  padding: '15px',
                  background: 'linear-gradient(135deg, #2B124C, #854F6C)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Start Timer
              </button>
            </>
          ) : (
            <>
              <div className="timer-display" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ 
                  fontSize: '64px', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #2B124C, #854F6C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '10px'
                }}>
                  {formatTime(timeLeft)}
                </div>
                <div style={{ fontSize: '18px', color: '#854F6C' }}>
                  {isRunning ? 'Study Time' : 'Paused'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!isRunning ? (
                  <button 
                    onClick={() => setIsRunning(true)}
                    style={{ 
                      flex: 1,
                      padding: '12px',
                      background: '#2B124C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Resume
                  </button>
                ) : (
                  <button 
                    onClick={handlePause}
                    style={{ 
                      flex: 1,
                      padding: '12px',
                      background: '#854F6C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Pause
                  </button>
                )}
                <button 
                  onClick={handleReset}
                  style={{ 
                    flex: 1,
                    padding: '12px',
                    background: '#DFB6B2',
                    color: '#522B5B',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
