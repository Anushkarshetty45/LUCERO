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
  const [chatSize, setChatSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [isSidebarMode, setIsSidebarMode] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const chatEndRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null)
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

      // Build conversation history with system context
      const systemPrompt = `You are a friendly, enthusiastic AI tutor who loves teaching! 🌟

PERSONALITY:
- Be warm, encouraging, and genuinely excited about helping students learn
- Use a conversational, supportive tone (like a helpful friend who's really good at teaching)
- Celebrate their questions and curiosity
- Share enthusiasm for the subject matter
- Remember everything discussed in this conversation and reference it naturally
- Use friendly language and occasional emojis to keep things engaging

CONTEXT:
The student is learning about "${selectedLesson.title}" in their ${course?.subject} course titled "${course?.title}".

LESSON CONTENT:
${lessonContext.substring(0, 2500)}

CONVERSATION MEMORY:
Remember and reference our entire conversation history. Build upon what we've discussed. If the student asks follow-up questions, connect them to previous topics we covered.

RESPONSE STYLE:
- Start with a friendly acknowledgment or encouragement
- Structure explanations in clear, organized bullet points
- Use bullet points (•) for main ideas
- Use sub-bullets (  ◦) for supporting details
- Keep explanations clear but conversational (1-3 sentences per point)
- End with an encouraging note or helpful question to deepen understanding
- Use line breaks between sections for readability

Be the tutor every student wishes they had - knowledgeable, patient, and genuinely excited to help! 😊`

      // Build the full conversation with history
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: "Hi! I'm so excited to help you learn! 🎓 I'll remember everything we discuss and build on our conversation. What would you like to explore first?" }]
        }
      ]

      // Add all previous messages to maintain context
      chatMessages.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })
      })

      // Add the current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      })

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.8,
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
        { role: 'assistant', content: 'Oops! I ran into a small hiccup. 😅 Could you try asking that again? I promise I\'m listening!' }
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSidebarMode) return // Don't allow dragging in sidebar mode

    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragRef.current || isSidebarMode) return

    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY

    setPosition({
      x: dragRef.current.initialX + deltaX,
      y: dragRef.current.initialY + deltaY
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    dragRef.current = null
  }

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, position])

  const toggleSidebarMode = () => {
    setIsSidebarMode(!isSidebarMode)
    if (!isSidebarMode) {
      // Reset position when switching back to sidebar mode
      setPosition({ x: 0, y: 0 })
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
      <header
        className={`course-header ${showChat && isSidebarMode ? 'chat-sidebar-open' : ''}`}
        style={{
          background: `linear-gradient(135deg, var(--bg-card) 0%, ${course.color}20 50%, var(--bg-secondary) 100%)`,
          borderLeft: `4px solid ${course.color}`
        }}
      >
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

      <div className={`course-content ${showChat && isSidebarMode ? 'chat-sidebar-open' : ''}`}>
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
            <div
              className={`chat-panel chat-${chatSize} ${isSidebarMode ? 'sidebar-mode' : 'floating-mode'} ${isDragging ? 'dragging' : ''}`}
              style={!isSidebarMode ? {
                transform: `translate(${position.x}px, ${position.y}px)`
              } : {}}
            >
              <div
                className="chat-header"
                onMouseDown={handleMouseDown}
                style={{ cursor: isSidebarMode ? 'default' : 'move' }}
              >
                <div className="chat-header-left">
                  <h3>AI Tutor Assistant</h3>
                  <button
                    className="mode-toggle-btn"
                    onClick={toggleSidebarMode}
                    title={isSidebarMode ? 'Switch to floating mode' : 'Switch to sidebar mode'}
                  >
                    {isSidebarMode ? '📌' : '📍'}
                  </button>
                </div>
                <div className="chat-header-right">
                  {!isSidebarMode && (
                    <div className="chat-size-controls">
                      <button
                        className={`size-btn ${chatSize === 'small' ? 'active' : ''}`}
                        onClick={() => setChatSize('small')}
                        title="Small"
                      >
                        S
                      </button>
                      <button
                        className={`size-btn ${chatSize === 'medium' ? 'active' : ''}`}
                        onClick={() => setChatSize('medium')}
                        title="Medium"
                      >
                        M
                      </button>
                      <button
                        className={`size-btn ${chatSize === 'large' ? 'active' : ''}`}
                        onClick={() => setChatSize('large')}
                        title="Large"
                      >
                        L
                      </button>
                    </div>
                  )}
                  <button
                    className="chat-close-btn"
                    onClick={() => setShowChat(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <p>👋 Hey there! I'm your friendly AI tutor!</p>
                    <p>I'm here to help you master <strong>{selectedLesson.title}</strong>! 🎓</p>
                    <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '12px' }}>
                      Ask me anything - I'll remember our entire conversation and build on what we discuss! ✨
                    </p>
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

