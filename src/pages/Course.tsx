import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useContentTranslation } from '../hooks/useContentTranslation'
import { getCourse, getLessons, deleteLesson, getCourseWithProgress, updateCourseAccess, startStudySession, endStudySession } from '../services/api'
import { Course as CourseType, Lesson } from '../types'
import AddTopicModal from '../components/AddTopicModal'
import LessonItem from '../components/LessonItem'
import './Course.css'
import NotesModal from '../components/NotesModal'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Converts raw markdown from AI to clean HTML
function formatMarkdown(text: string): string {
  const lines = text.split('\n')
  const html: string[] = []
  let inList = false
  let inSubList = false

  const closeSubList = () => {
    if (inSubList) { html.push('</ul>'); inSubList = false }
  }
  const closeList = () => {
    closeSubList()
    if (inList) { html.push('</ul>'); inList = false }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Horizontal rule ***  or ---
    if (/^\s*(\*{3,}|-{3,})\s*$/.test(line)) {
      closeList()
      html.push('<hr class="ai-divider"/>')
      continue
    }

    // H3 heading: ### text
    if (/^###\s+/.test(line)) {
      closeList()
      const content = inlineFormat(line.replace(/^###\s+/, ''))
      html.push(`<h3 class="ai-heading">${content}</h3>`)
      continue
    }

    // H2 heading: ## text
    if (/^##\s+/.test(line)) {
      closeList()
      const content = inlineFormat(line.replace(/^##\s+/, ''))
      html.push(`<h2 class="ai-heading">${content}</h2>`)
      continue
    }

    // H1 heading: # text
    if (/^#\s+/.test(line)) {
      closeList()
      const content = inlineFormat(line.replace(/^#\s+/, ''))
      html.push(`<h2 class="ai-heading">${content}</h2>`)
      continue
    }

    // Sub-bullet:   * or   - or   ◦ (2+ spaces indent)
    if (/^( {2,}|\t)([*\-•◦])\s+/.test(line)) {
      if (!inList) { html.push('<ul class="ai-list">'); inList = true }
      if (!inSubList) { html.push('<ul class="ai-sublist">'); inSubList = true }
      const content = inlineFormat(line.replace(/^[ \t]+[*\-•◦]\s+/, ''))
      html.push(`<li>${content}</li>`)
      continue
    }

    // Top-level bullet: * or - or • at start of line
    if (/^[*\-•]\s+/.test(line)) {
      closeSubList()
      if (!inList) { html.push('<ul class="ai-list">'); inList = true }
      const content = inlineFormat(line.replace(/^[*\-•]\s+/, ''))
      html.push(`<li>${content}</li>`)
      continue
    }

    // Numbered list: 1. text
    if (/^\d+\.\s+/.test(line)) {
      closeSubList()
      if (!inList) { html.push('<ol class="ai-list">'); inList = true }
      const content = inlineFormat(line.replace(/^\d+\.\s+/, ''))
      html.push(`<li>${content}</li>`)
      continue
    }

    // Empty line
    if (line.trim() === '') {
      closeList()
      html.push('<div class="ai-spacer"></div>')
      continue
    }

    // Regular paragraph
    closeList()
    html.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeList()
  return html.join('')
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

export default function Course() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseType | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showNotes, setShowNotes] = useState(false)

  // Translate the selected lesson title
  const translatedLessonTitle = useContentTranslation(selectedLesson?.title || '')

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
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  // Track study time while on Course page
  useEffect(() => {
    if (!user) return
    startStudySession(user.id)
      .then(session => {
        sessionIdRef.current = session.id
        sessionStartRef.current = new Date()
      })
      .catch(err => console.error('Failed to start course study session:', err))

    return () => {
      if (sessionIdRef.current && sessionStartRef.current) {
        const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        if (duration >= 60) {
          endStudySession(sessionIdRef.current, duration, user.id)
            .catch(err => console.error('Failed to end course study session:', err))
        }
      }
    }
  }, [user])

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

      // Update the last accessed timestamp
      if (user?.id) {
        await updateCourseAccess(user.id, courseId!)
      }
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

    // Add user message with unique ID
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { id: `user-${Date.now()}`, role: 'user', content: userMessage }
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
The student is learning about "${translatedLessonTitle}" in their ${course?.subject} course titled "${course?.title}".

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

      // Add AI response with unique ID
      setChatMessages([
        ...newMessages,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: aiResponse }
      ])
    } catch (error: any) {
      console.error('Chat error:', error)
      setChatMessages([
        ...newMessages,
        { id: `assistant-error-${Date.now()}`, role: 'assistant', content: 'Oops! I ran into a small hiccup. 😅 Could you try asking that again? I promise I\'m listening!' }
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
        <h2>{t('course.courseNotFound')}</h2>
        <button onClick={() => navigate('/dashboard')}>{t('course.backToDashboard')}</button>
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
          <Link to="/dashboard" className="back-button">← {t('course.backToDashboard')}</Link>
          <h1>{course.title}</h1>
          <p className="course-subject">{course.subject}</p>
          {course.description && <p className="course-description">{course.description}</p>}
          <button
            className="btn-notes"
            onClick={() => setShowNotes(true)}
          >
            📝 {t('course.myNotes')}
          </button>
        </div>
      </header>

      <div className={`course-content ${showChat && isSidebarMode ? 'chat-sidebar-open' : ''}`}>
        {/* Sidebar - Topics List */}
        <aside className="topics-sidebar">
          <div className="sidebar-header">
            <h2>{t('course.topics')}</h2>
            <button
              className="btn-add-topic"
              onClick={() => setShowAddTopic(true)}
            >
              + {t('course.addTopic')}
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="empty-topics">
              <p>{t('course.noTopics')}</p>
              <p className="small">{t('course.addTopicPrompt')}</p>
            </div>
          ) : (
            <ul className="topics-list">
              {lessons.map((lesson, index) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  isActive={selectedLesson?.id === lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  onDelete={handleDeleteLesson}
                />
              ))}
            </ul>
          )}
        </aside>

        {/* Main Content - Notes Display */}
        <main className="notes-content">
          {selectedLesson ? (
            <div className="notes-viewer">
              <h2>{translatedLessonTitle}</h2>
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
                    <p>I'm here to help you master <strong>{translatedLessonTitle}</strong>! 🎓</p>
                    <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '12px' }}>
                      Ask me anything - I'll remember our entire conversation and build on what we discuss! ✨
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.role}`}>
                      <div className="message-content">
                        {msg.role === 'assistant' ? (
                          <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
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

