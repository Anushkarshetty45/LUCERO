import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createStudySession, getStudySessionByCode, joinStudySession, recordDailyActivity } from '../services/api'
import type { StudySession } from '../services/api'
import VideoRoom from './VideoRoom'
import './GroupStudyModal.css'

interface GroupStudyModalProps {
  onClose: () => void
}

type ViewMode = 'menu' | 'create' | 'join' | 'video'

export default function GroupStudyModal({ onClose }: GroupStudyModalProps) {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [meetingCode, setMeetingCode] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')

  const handleCreateMeeting = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { session, meetingCode } = await createStudySession(
        user.id,
        sessionTitle || 'Group Study Session'
      )

      setCurrentSession(session)
      setGeneratedCode(meetingCode)
      setViewMode('create')
    } catch (err: any) {
      console.error('Create meeting error:', err)
      setError(err.message || 'Failed to create meeting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMeeting = async () => {
    if (!user) {
      setError('Please log in to join a meeting')
      return
    }

    const trimmedCode = meetingCode.trim()
    if (!trimmedCode || trimmedCode.length < 6) {
      setError('Please enter a valid 6-character meeting code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const session = await getStudySessionByCode(trimmedCode)

      if (!session) {
        setError('Meeting not found. Please check the code and try again.')
        setLoading(false)
        return
      }

      await joinStudySession(session.id, user.id)
      setCurrentSession(session)

      // Record group study activity for streak
      await recordDailyActivity(user.id, 'group_study')

      setViewMode('video')
    } catch (err: any) {
      console.error('Join meeting error:', err)
      setError(err.message || 'Failed to join meeting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartVideo = async () => {
    if (user) {
      // Record group study activity for streak
      await recordDailyActivity(user.id, 'group_study')
    }
    setViewMode('video')
  }

  const handleLeaveSession = () => {
    setCurrentSession(null)
    setViewMode('menu')
    setMeetingCode('')
    setSessionTitle('')
    setGeneratedCode('')
    setError('')
  }

  if (viewMode === 'video' && currentSession) {
    return (
      <VideoRoom
        session={currentSession}
        userId={user!.id}
        onLeave={handleLeaveSession}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="group-study-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎥 Group Study</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {viewMode === 'menu' && (
            <div className="study-menu">
              <div className="menu-header">
                <h3>Study Together with Friends</h3>
                <p>Create a study session or join someone else's session using a meeting code</p>
              </div>

              <div className="menu-options">
                <div className="menu-option-card">
                  <div className="option-icon">✨</div>
                  <h4>Create Meeting</h4>
                  <p>Start a new study session and invite friends</p>
                  <input
                    type="text"
                    className="session-title-input"
                    placeholder="Session title (optional)"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    maxLength={50}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleCreateMeeting}
                    disabled={loading}
                  >
                    {loading ? '⏳ Creating...' : '➕ Create Meeting'}
                  </button>
                </div>

                <div className="menu-divider">
                  <span>OR</span>
                </div>

                <div className="menu-option-card">
                  <div className="option-icon">🔗</div>
                  <h4>Join Meeting</h4>
                  <p>Enter a meeting code to join a friend's session</p>
                  <input
                    type="text"
                    className="meeting-code-input"
                    placeholder="Enter 6-character code"
                    value={meetingCode}
                    onChange={(e) => {
                      setMeetingCode(e.target.value.toUpperCase())
                      setError('') // Clear error when user types
                    }}
                    maxLength={6}
                  />
                  <button
                    className="btn-secondary"
                    onClick={handleJoinMeeting}
                    disabled={loading || meetingCode.trim().length < 6}
                  >
                    {loading ? '⏳ Joining...' : '🚪 Join Meeting'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          {viewMode === 'create' && currentSession && (
            <div className="meeting-created">
              <div className="success-icon">✅</div>
              <h3>Meeting Created!</h3>
              <p>Share this code with your friends to invite them</p>

              <div className="meeting-code-display">
                <div className="code-label">Meeting Code</div>
                <div className="code-value">{generatedCode}</div>
                <button
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode)
                    alert('Meeting code copied to clipboard!')
                  }}
                >
                  📋 Copy Code
                </button>
              </div>

              <div className="meeting-info">
                <p><strong>Session:</strong> {currentSession.title}</p>
                <p><strong>Host:</strong> You</p>
              </div>

              <div className="meeting-actions">
                <button className="btn-start-video" onClick={handleStartVideo}>
                  🎥 Start Video Call
                </button>
                <button className="btn-cancel" onClick={handleLeaveSession}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
