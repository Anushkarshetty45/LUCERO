import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createCourse } from '../services/api'
import './CreateCourseModal.css'

interface CreateCourseModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCourseModal({ onClose, onSuccess }: CreateCourseModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedColor] = useState('#ffffff') // Default to white
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Course title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await createCourse({
        user_id: user!.id,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        color: selectedColor
      })

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create course')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Course</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              placeholder="e.g., Introduction to Chemistry"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              placeholder="e.g., Chemistry, Math, Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="What will students learn in this course?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}