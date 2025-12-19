import { useState, useEffect, useRef } from 'react'
import { createLesson, createTopicChat, getChatMessages, createChatMessage, getTopicChats } from '../services/api'
import { Lesson, TopicChat, TopicChatMessage } from '../types'
import { supabase } from '../services/supabase'
import './AddTopicModal.css'

interface AddTopicModalProps {
  courseId: string
  courseTitle: string
  courseSubject: string
  onClose: () => void
  onSuccess: (lesson: Lesson) => void
}

export default function AddTopicModal({
  courseId,
  courseTitle,
  courseSubject,
  onClose,
  onSuccess
}: AddTopicModalProps) {
  const [topicName, setTopicName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)

  // Chat-related states
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<TopicChat[]>([])
  const [currentMessages, setCurrentMessages] = useState<TopicChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [generatedNotes, setGeneratedNotes] = useState('')
  const [userId, setUserId] = useState<string>('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserId(data.user.id)
        // Load existing chats for this course
        const chats = await getTopicChats(data.user.id, courseId)
        setChatSessions(chats)
      }
    }
    getUserId()
  }, [courseId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  const generateNotes = async (topic: string): Promise<string> => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to your .env file')
    }

    const prompt = `You are a world-class educator and subject matter expert. Create EXTREMELY DETAILED, COMPREHENSIVE study notes about "${topic}" for a "${courseSubject}" course titled "${courseTitle}".

REQUIREMENTS:
- Length: Minimum 1500-2000 words
- Depth: Explain as if teaching a complete beginner AND providing advanced insights
- Organization: Use clear hierarchical structure with multiple levels of headings
- Examples: Provide multiple real-world examples for every concept

STRUCTURE YOUR RESPONSE AS FOLLOWS:

# ${topic}

## 1. Introduction & Overview
- What is ${topic}? (detailed definition)
- Why is this important in ${courseSubject}?
- Historical context and evolution
- How it connects to other concepts in ${courseTitle}
- Prerequisites needed to understand this topic

## 2. Core Concepts & Fundamentals
Break down into multiple subsections (use ### for each):
- Define every key term and concept
- Explain the underlying principles
- Show the logical progression of ideas
- Use analogies to explain complex concepts
- Provide visual descriptions

## 3. Deep Dive: How It Works
Provide a comprehensive, step-by-step explanation:
- The mechanism/process in detail
- Why it works this way
- Theoretical foundations
- Mathematical/logical frameworks (if applicable)
- Edge cases and special conditions

## 4. Real-World Applications
Provide 5-7 detailed examples:
- Practical use cases
- Industry applications
- Daily life examples
- Case studies
- Success stories
- Each example should be 2-3 paragraphs

## 5. Types/Categories/Classifications
If applicable, break down different types or categories:
- Complete classification
- Comparison between different types
- When to use each type
- Advantages and disadvantages of each

## 6. Implementation/Practice
- Step-by-step guide for practical application
- Code examples (if applicable)
- Procedures and methodologies
- Best practices
- Tips and tricks

## 7. Common Challenges & Solutions
- 5-7 common mistakes beginners make
- Why these mistakes happen
- How to avoid them
- How to fix them
- Debugging strategies

## 8. Advanced Topics & Extensions
- Related advanced concepts
- Next steps for deeper learning
- Current research or developments
- Future trends
- Connections to other topics

## 9. Practice & Assessment
Provide:
- 3 easy practice questions
- 3 medium difficulty questions  
- 2 challenging questions
- Include hints and approaches for each

## 10. Key Takeaways & Summary
- 10-15 bullet points summarizing everything
- Most important concepts to remember
- Quick reference guide
- Study tips for this topic

## 11. Additional Resources
- Recommended readings
- Videos to watch
- Tools and software
- Websites and documentation

FORMAT INSTRUCTIONS:
- Use ### for main sections
- Use #### for subsections
- Use **bold** for important terms
- Use *italic* for emphasis
- Use bullet points extensively
- Use numbered lists for sequences
- Add code blocks if showing code
- Make it visually organized and scannable
- Use tables if comparing concepts

Write in a clear, engaging, conversational but professional tone. Explain complex ideas simply without dumbing them down. Be thorough and leave no concept unexplained.`

    try {
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
              maxOutputTokens: 32768,
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to generate notes')
      }

      const data = await response.json()
      const generatedText = data.candidates[0].content.parts[0].text

      // Convert markdown-style formatting to HTML
      let htmlContent = generatedText
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to <em>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert ### Heading to <h3>
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        // Convert ## Heading to <h2>
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        // Convert # Heading to <h1>
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Convert numbered lists
        .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
        // Convert bullet points
        .replace(/^[-*]\s+(.*$)/gim, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
        // Convert double line breaks to paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Wrap in paragraph tags
        .replace(/^(?!<[hul])/gim, '<p>')
        .replace(/(?<![>])$/gim, '</p>')

      return htmlContent
    } catch (error: any) {
      console.error('AI Generation Error:', error)
      throw new Error('Failed to generate notes with AI: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topicName.trim()) {
      setError('Please enter a topic name')
      return
    }

    setLoading(true)
    setGeneratingNotes(true)
    setError('')

    try {
      // Generate notes using AI
      console.log('🤖 Generating notes for:', topicName)
      const notes = await generateNotes(topicName)
      setGeneratedNotes(notes)

      console.log('✅ Notes generated successfully')

      // Create lesson with generated notes
      const newLesson = await createLesson({
        course_id: courseId,
        title: topicName,
        content: notes
      })

      console.log('📝 Lesson created:', newLesson)

      // Auto-create chat with context
      if (userId) {
        const chat = await createTopicChat(userId, courseId, topicName, notes)
        setCurrentChatId(chat.id)
        setChatSessions(prev => [chat, ...prev])

        // Add welcome message
        const welcomeMsg = await createChatMessage(
          chat.id,
          userId,
          'assistant',
          `Hi! I'm here to help you learn about "${topicName}". Ask me anything!`
        )
        setCurrentMessages([welcomeMsg])
      }

      onSuccess(newLesson)
    } catch (err: any) {
      console.error('❌ Error:', err)
      setError(err.message || 'Failed to create topic')
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentChatId || !userId) return

    const userMessage = chatInput
    setChatInput('')
    setSendingMessage(true)

    try {
      // Save user message
      const userMsg = await createChatMessage(currentChatId, userId, 'user', userMessage)
      setCurrentMessages(prev => [...prev, userMsg])

      // Build context-aware prompt
      const systemContext = `You are an AI tutor helping with the topic: "${topicName}".

Study notes:
${generatedNotes}

Answer the student's questions based on these notes. Keep responses concise (2-3 paragraphs).`

      // Call Gemini API
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemContext}\n\nUser question: ${userMessage}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        }
      )

      const data = await response.json()
      const aiResponse = data.candidates[0].content.parts[0].text

      // Save assistant message
      const assistantMsg = await createChatMessage(currentChatId, userId, 'assistant', aiResponse)
      setCurrentMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleNewChat = async () => {
    if (!topicName || !userId) {
      setError('Please generate a topic first')
      return
    }

    try {
      const newChat = await createTopicChat(userId, courseId, topicName, generatedNotes)
      setCurrentChatId(newChat.id)
      setCurrentMessages([])
      setChatSessions(prev => [newChat, ...prev])

      // Add welcome message
      const welcomeMsg = await createChatMessage(
        newChat.id,
        userId,
        'assistant',
        `New chat started for "${topicName}". How can I help you?`
      )
      setCurrentMessages([welcomeMsg])
    } catch (error: any) {
      console.error('Error creating new chat:', error)
      setError('Failed to create new chat')
    }
  }

  const handleLoadChat = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chatId = e.target.value
    if (!chatId) return

    try {
      setCurrentChatId(chatId)
      const messages = await getChatMessages(chatId)
      setCurrentMessages(messages)

      // Load topic name and notes from selected chat
      const selectedChat = chatSessions.find(c => c.id === chatId)
      if (selectedChat) {
        setTopicName(selectedChat.topic_name)
        if (selectedChat.topic_context) {
          setGeneratedNotes(selectedChat.topic_context)
        }
      }
    } catch (error: any) {
      console.error('Error loading chat:', error)
      setError('Failed to load chat')
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isChatOpen ? 'modal-with-chat' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Topic</h2>
          <button
            type="button"
            className="chat-toggle-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            title={isChatOpen ? 'Close AI Chat' : 'Open AI Chat'}
          >
            {isChatOpen ? '→' : '💬 AI Chat'}
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body-wrapper">
          {/* Left Panel: Topic Form */}
          <div className="topic-form-panel">
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p className="course-info">
                  Course: <strong>{courseTitle}</strong> ({courseSubject})
                </p>

                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label htmlFor="topicName">Topic Name</label>
                  <input
                    id="topicName"
                    type="text"
                    placeholder="e.g., Introduction to Atomic Structure"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <span className="hint">What topic would you like to learn about?</span>
                </div>

                {generatingNotes && (
                  <div className="generating-status">
                    <div className="spinner-small"></div>
                    <p>🤖 Generating detailed notes with AI...</p>
                  </div>
                )}
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
                  disabled={loading}
                >
                  {loading ? 'Generating...' : '✨ Generate Notes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Chat Sidebar */}
          <div className={`chat-sidebar ${isChatOpen ? 'open' : ''}`}>
            <div className="chat-header">
              <h3>🤖 AI Assistant</h3>
              <div className="chat-controls">
                <button
                  type="button"
                  className="new-chat-btn"
                  onClick={handleNewChat}
                  disabled={!generatedNotes}
                  title="Start a new chat"
                >
                  + New Chat
                </button>
                {chatSessions.length > 0 && (
                  <select
                    className="chat-history-select"
                    onChange={handleLoadChat}
                    value={currentChatId || ''}
                  >
                    <option value="">Load chat history...</option>
                    {chatSessions.map(chat => (
                      <option key={chat.id} value={chat.id}>
                        {chat.topic_name} - {formatDate(chat.created_at)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {currentMessages.length === 0 && (
                <div className="chat-empty-state">
                  <p>Generate a topic to start chatting with the AI assistant!</p>
                </div>
              )}
              {currentMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="chat-message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Ask about this topic..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sendingMessage || !currentChatId}
              />
              <button
                type="button"
                className="chat-send-btn"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || sendingMessage || !currentChatId}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

