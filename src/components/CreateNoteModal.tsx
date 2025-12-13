import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Course } from '../types'
import './CreateNoteModal.css'

interface CreateNoteModalProps {
  userId: string
  onClose: () => void
  onNoteCreated: () => void
}

export default function CreateNoteModal({ userId, onClose, onNoteCreated }: CreateNoteModalProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadUserCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      console.error('Error loading courses:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedCourseId || !topic.trim() || !content.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_notes')
        .insert({
          user_id: userId,
          course_id: selectedCourseId,
          topic: topic.trim(),
          content: content.trim()
        })

      if (error) throw error

      onNoteCreated()
      onClose()
    } catch (err) {
      console.error('Error creating note:', err)
      setError('Failed to create note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Create New Note</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="course">Course</label>
              <select
                id="course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <span className="hint">Create a course first to add notes</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="topic">Topic</label>
              <input
                id="topic"
                type="text"
                placeholder="e.g., Newton's Laws of Motion"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                placeholder="Write your notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={10}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || courses.length === 0}
            >
              {loading ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
