import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CourseWithProgress } from '../types'
import { deleteCourse } from '../services/api'
import './CourseCard.css'

interface CourseCardProps {
  course: CourseWithProgress
  onUpdate: () => void
}

export default function CourseCard({ course, onUpdate }: CourseCardProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteCourse(course.id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert(t('course.errorDelete'))
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
          {course.description || t('course.noDescription')}
        </p>

        <div className="course-stats">
          <div className="stat">
            <span className="stat-label">{t('course.topics')}</span>
            <span className="stat-value">{course.total_lessons}</span>
          </div>
        </div>

        <div className="course-footer-info">
          <span className="created-date">
            📅 {t('course.created')} {new Date(course.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="course-card-actions">
          <button
            className="btn-open"
            onClick={() => navigate(`/course/${course.id}`)}
          >
            {t('course.openCourse')}
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
                {t('common.edit')}
              </button>
              <button
                className="delete-btn"
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
              >
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>{t('course.deleteCourse')}</h3>
            <p>{t('course.deleteConfirmation', { title: course.title })}</p>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn-delete"
                onClick={handleDelete}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}