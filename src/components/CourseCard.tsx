import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CourseWithProgress } from '../types'
import { deleteCourse } from '../services/api'
import './CourseCard.css'

interface CourseCardProps {
  course: CourseWithProgress
  onUpdate: () => void
}

export default function CourseCard({ course, onUpdate }: CourseCardProps) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteCourse(course.id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course')
    }
  }

  return (
    <div className="course-card">
      <div
        className="course-card-header"
        style={{
          background: `linear-gradient(135deg, var(--bg-card) 0%, ${course.color}15 50%, var(--bg-secondary) 100%)`,
          borderLeft: `4px solid ${course.color}`
        }}
        onClick={() => navigate(`/course/${course.id}`)}
      >
        <h4>{course.title}</h4>
        {course.subject && (
          <span className="course-subject-badge">{course.subject}</span>
        )}
      </div>

      <div className="course-card-body">
        <p className="course-description">
          {course.description || 'No description'}
        </p>

        <div className="course-stats">
          <div className="stat">
            <span className="stat-label">Topics</span>
            <span className="stat-value">{course.total_lessons}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Last Studied</span>
            <span className="stat-value stat-small">
              {course.last_accessed 
                ? new Date(course.last_accessed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not yet'}
            </span>
          </div>
        </div>

        <div className="course-footer-info">
          <span className="created-date">
            📅 Created {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="course-card-actions">
          <button 
            className="btn-open"
            onClick={() => navigate(`/course/${course.id}`)}
          >
            Open Course
          </button>
          <button 
            className="btn-menu"
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>

          {showMenu && (
            <div className="course-menu">
              <button onClick={() => {
                navigate(`/course/${course.id}/edit`)
                setShowMenu(false)
              }}>
                Edit
              </button>
              <button 
                className="delete-btn"
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Course?</h3>
            <p>Are you sure you want to delete "{course.title}"? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}