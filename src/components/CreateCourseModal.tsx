import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { createCourse } from '../services/api'
import './CreateCourseModal.css'

interface CreateCourseModalProps {
  onClose: () => void
  onSuccess: () => void
  currentCourseCount: number
}

export default function CreateCourseModal({ onClose, onSuccess, currentCourseCount }: CreateCourseModalProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { limits } = useSubscription()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedColor] = useState('#ffffff') // Default to white
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError(t('createCourse.errorTitleRequired'))
      return
    }

    if (!limits.canCreateCourse) {
      setError(`📚 Free plan limit: 3 courses maximum. You have ${currentCourseCount}. Upgrade to Pro for unlimited courses!`)
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
      setError(err.message || t('createCourse.errorFailed'))
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('createCourse.title')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>{t('createCourse.courseTitle')}</label>
            <input
              type="text"
              placeholder={t('createCourse.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('createCourse.subject')}</label>
            <input
              type="text"
              placeholder={t('createCourse.subjectPlaceholder')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{t('createCourse.description')}</label>
            <textarea
              placeholder={t('createCourse.descriptionPlaceholder')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={loading}
            >
              {loading ? t('createCourse.creating') : t('createCourse.createButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}