import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getCourse, getLessons, deleteLesson } from '../services/api'
import { Course as CourseType, Lesson } from '../types'
import AddTopicModal from '../components/AddTopicModal'
import './Course.css'
import NotesModal from '../components/NotesModal'

export default function Course() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseType | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      const courseData = await getCourse(courseId!)
      setCourse(courseData)
      
      const lessonsData = await getLessons(courseId!)
      setLessons(lessonsData)
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return
    
    try {
      await deleteLesson(lessonId)
      setLessons(lessons.filter(l => l.id !== lessonId))
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(null)
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete topic')
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading course...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="error-screen">
        <h2>Course not found</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="course-page">
      {/* Header */}
      <header className="course-header" style={{ background: course.color }}>
        <div className="course-header-content">
          <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
          <h1>{course.title}</h1>
          <p className="course-subject">{course.subject}</p>
          {course.description && <p className="course-description">{course.description}</p>}
          <button 
            className="btn-notes"
            onClick={() => setShowNotes(true)}
          >
            📝 My Notes
          </button>
        </div>
      </header>

      <div className="course-content">
        {/* Sidebar - Topics List */}
        <aside className="topics-sidebar">
          <div className="sidebar-header">
            <h2>Topics</h2>
            <button 
              className="btn-add-topic"
              onClick={() => setShowAddTopic(true)}
            >
              + Add Topic
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="empty-topics">
              <p>No topics yet</p>
              <p className="small">Click "Add Topic" to start learning!</p>
            </div>
          ) : (
            <ul className="topics-list">
              {lessons.map((lesson, index) => (
                <li 
                  key={lesson.id}
                  className={selectedLesson?.id === lesson.id ? 'active' : ''}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="topic-number">{index + 1}</div>
                  <div className="topic-info">
                    <h3>{lesson.title}</h3>
                    {lesson.duration > 0 && (
                      <span className="topic-duration">{lesson.duration} min</span>
                    )}
                  </div>
                  <button 
                    className="btn-delete-topic"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLesson(lesson.id)
                    }}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main Content - Notes Display */}
        <main className="notes-content">
          {selectedLesson ? (
            <div className="notes-viewer">
              <h2>{selectedLesson.title}</h2>
              <div 
                className="notes-text"
                dangerouslySetInnerHTML={{ __html: selectedLesson.content || '<p>No notes available</p>' }}
              />
            </div>
          ) : (
            <div className="no-selection">
              <div className="empty-icon">📚</div>
              <h3>Select a topic to view notes</h3>
              <p>Choose a topic from the sidebar or add a new one</p>
            </div>
          )}
        </main>
        {showNotes && user && (
  <NotesModal
    userId={user.id}
    courseId={courseId!}
    courseTitle={course.title}
    onClose={() => setShowNotes(false)}
  />
)}
      </div>

      {/* Add Topic Modal */}
      {showAddTopic && (
        <AddTopicModal
          courseId={courseId!}
          courseTitle={course.title}
          courseSubject={course.subject}
          onClose={() => setShowAddTopic(false)}
          onSuccess={(newLesson: Lesson) => {
            setLessons([...lessons, newLesson])
            setSelectedLesson(newLesson)
            setShowAddTopic(false)
          }}
        />
      )}

      {/* Notes Modal */}
      {showNotes && user && (
        <NotesModal
          userId={user.id}
          courseId={courseId!}
          courseTitle={course.title}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  )
}

