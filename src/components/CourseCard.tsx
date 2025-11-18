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
        style={{ background: course.color }}
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
            <span className="stat-label">Lessons</span>
            <span className="stat-value">{course.total_lessons}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{course.completed_lessons}</span>
          </div>
        </div>

        <div className="course-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${course.progress_percentage}%` }}
            ></div>
          </div>
          <span className="progress-text">{course.progress_percentage}%</span>
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