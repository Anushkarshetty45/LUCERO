import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getCourse, getLessons, deleteLesson, getCourseWithProgress } from '../services/api'
import { Course as CourseType, Lesson } from '../types'
import AddTopicModal from '../components/AddTopicModal'
import './Course.css'
import NotesModal from '../components/NotesModal'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

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

  // Chat state
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      console.log('Loading course:', courseId, 'User:', user?.id)
      // Use getCourseWithProgress to get total_lessons count for verification
      const courseData = await getCourseWithProgress(courseId!, user?.id || '')
      setCourse(courseData)
      console.log('Course data loaded:', courseData)

      const lessonsData = await getLessons(courseId!)
      console.log('Lessons loaded:', lessonsData.length)

      // If we have a mismatch, log it
      if (courseData.total_lessons > 0 && lessonsData.length === 0) {
        console.warn('Mismatch: Course has lessons but getLessons returned empty')
      }

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

  // Clear chat when lesson changes
  useEffect(() => {
    setChatMessages([])
    setShowChat(false)
  }, [selectedLesson?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedLesson || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatLoading(true)

    // Add user message
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMessage }
    ]
    setChatMessages(newMessages)

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY

      if (!apiKey) {
        throw new Error('Gemini API key not found')
      }

      // Create context from the lesson content (strip HTML for cleaner context)
      const lessonContext = selectedLesson.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''

      const prompt = `You are a helpful AI tutor assistant. The student is currently learning about "${selectedLesson.title}" in their ${course?.subject} course titled "${course?.title}".

Here is the lesson content they are studying:
${lessonContext.substring(0, 3000)}

Based on this lesson content, answer the following question from the student.

IMPORTANT FORMATTING RULES:
- Structure your response in clear, organized bullet points
- Use bullet points (•) for main points
- Use sub-bullets (  ◦) for supporting details
- Keep each point concise (1-2 sentences)
- Start with a brief intro sentence if needed
- Number steps if explaining a process
- Use line breaks between sections for readability

Question: ${userMessage}`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to get AI response')
      }

      const data = await response.json()
      const aiResponse = data.candidates[0].content.parts[0].text

      // Add AI response
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: aiResponse }
      ])
    } catch (error: any) {
      console.error('Chat error:', error)
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ])
    } finally {
      setChatLoading(false)
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
                    {(lesson.duration || 0) > 0 && (
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

      {/* AI Chat Assistant */}
      {selectedLesson && (
        <>
          {/* Chat Toggle Button */}
          {!showChat && (
            <button
              className="chat-toggle-btn"
              onClick={() => setShowChat(true)}
              title="Ask AI Assistant"
            >
              <span className="chat-icon">💬</span>
            </button>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="chat-panel">
              <div className="chat-header">
                <h3>AI Tutor Assistant</h3>
                <button
                  className="chat-close-btn"
                  onClick={() => setShowChat(false)}
                >
                  ✕
                </button>
              </div>

              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <p>👋 Hi! I'm your AI tutor.</p>
                    <p>Ask me anything about <strong>{selectedLesson.title}</strong>!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                      <div className="message-content">
                        {msg.role === 'assistant' ? (
                          <div dangerouslySetInnerHTML={{
                            __html: msg.content
                              .replace(/\n/g, '<br/>')
                              .replace(/•/g, '• ')
                              .replace(/◦/g, '&nbsp;&nbsp;◦ ')
                          }} />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="chat-message assistant">
                    <div className="message-content typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask a question about this topic..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  disabled={chatLoading}
                />
                <button
                  className="chat-send-btn"
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                >
                  ➤
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

