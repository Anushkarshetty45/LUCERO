import { useState, useEffect, useRef } from 'react'
import {
  getChatSessions,
  createChatSession,
  getChatMessages,
  createChatMessage
} from '../../services/pdfAnalysisApi'
import { generateChatPrompt } from '../../services/aiPrompts'
import type { PDFChatSession, PDFChatMessage } from '../../types/pdfAnalysis'

interface ChatTabProps {
  analysisId: string
  pdfContent: string
  userId: string
}

export default function ChatTab({ analysisId, pdfContent, userId }: ChatTabProps) {
  const [sessions, setSessions] = useState<PDFChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<PDFChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
  }, [analysisId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await getChatSessions(analysisId)
      setSessions(data)

      if (data.length > 0) {
        await loadSession(data[0].id)
      }
    } catch (err) {
      console.error('Load sessions error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      setCurrentSession(sessionId)
      const msgs = await getChatMessages(sessionId)
      setMessages(msgs)
    } catch (err) {
      console.error('Load messages error:', err)
    }
  }

  const handleNewSession = async () => {
    try {
      const session = await createChatSession(analysisId, userId, 'New Chat')
      setSessions(prev => [session, ...prev])
      setCurrentSession(session.id)
      setMessages([])
    } catch (err) {
      console.error('Create session error:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSession || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    try {
      // Add user message
      const userMsg = await createChatMessage(currentSession, 'user', userMessage)
      setMessages(prev => [...prev, userMsg])

      // Generate AI response
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const prompt = generateChatPrompt(pdfContent, conversationHistory, userMessage)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2048
            }
          })
        }
      )

      const data = await response.json()
      const aiResponse = data.candidates[0].content.parts[0].text

      // Save AI response
      const assistantMsg = await createChatMessage(currentSession, 'assistant', aiResponse)
      setMessages(prev => [...prev, assistantMsg])

    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="tab-loading"><div className="spinner"></div><p>Loading chat...</p></div>
  }

  return (
    <div className="chat-tab">
      <div className="chat-header">
        <h3>💬 Chat with PDF</h3>
        <button className="btn-new-chat" onClick={handleNewSession}>
          + New Chat
        </button>
      </div>

      {sessions.length > 1 && (
        <div className="chat-sessions">
          <select
            value={currentSession || ''}
            onChange={(e) => loadSession(e.target.value)}
            className="session-selector"
          >
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.title} - {new Date(session.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && !currentSession && (
          <div className="chat-empty">
            <p>👋 Start a chat to ask questions about this PDF!</p>
            <button onClick={handleNewSession}>Start Chatting</button>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="chat-message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {currentSession && (
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question about this PDF..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={sending}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      )}
    </div>
  )
}
