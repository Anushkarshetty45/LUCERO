import { useState, useEffect } from 'react'
import { getUserNotes, saveUserNotes } from '../services/api'
import './NotesModal.css'

interface NotesModalProps {
  userId: string
  courseId: string
  courseTitle: string
  onClose: () => void
}

export default function NotesModal({ userId, courseId, courseTitle, onClose }: NotesModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await getUserNotes(userId, courseId)
      if (data) {
        setNotes(data.content)
        setLastSaved(new Date(data.updated_at))
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUserNotes(userId, courseId, notes)
      setLastSaved(new Date())
      alert('Notes saved successfully!')
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notes-header">
          <div>
            <h2>📝 My Notes</h2>
            <p className="course-name">{courseTitle}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="notes-body">
          {loading ? (
            <p>Loading notes...</p>
          ) : (
            <textarea
              className="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your personal notes here..."
            />
          )}
        </div>

        <div className="notes-footer">
          <div className="last-saved">
            {lastSaved && `Last saved: ${lastSaved.toLocaleString()}`}
          </div>
          <div className="notes-actions">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}