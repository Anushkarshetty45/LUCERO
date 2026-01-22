import { useContentTranslation } from '../hooks/useContentTranslation'
import { Lesson } from '../types'

interface LessonItemProps {
  lesson: Lesson
  index: number
  isActive: boolean
  onClick: () => void
  onDelete: (id: string) => void
}

export default function LessonItem({ lesson, index, isActive, onClick, onDelete }: LessonItemProps) {
  const translatedTitle = useContentTranslation(lesson.title)

  return (
    <li
      className={isActive ? 'active' : ''}
      onClick={onClick}
    >
      <div className="topic-number">{index + 1}</div>
      <div className="topic-info">
        <h3>{translatedTitle}</h3>
        {(lesson.duration || 0) > 0 && (
          <span className="topic-duration">{lesson.duration} min</span>
        )}
      </div>
      <button
        className="btn-delete-topic"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(lesson.id)
        }}
      >
        🗑️
      </button>
    </li>
  )
}
