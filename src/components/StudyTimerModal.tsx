import { useState } from 'react'
import './StudyTimerModal.css'

interface StudyTimerModalProps {
  onClose: () => void
}

export default function StudyTimerModal({ onClose }: StudyTimerModalProps) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(25)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content timer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏱️ Study Timer</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
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
            onClick={() => alert(`Timer set for ${hours} hours and ${minutes} minutes!`)}
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
            Set Timer
          </button>
        </div>
      </div>
    </div>
  )
}
