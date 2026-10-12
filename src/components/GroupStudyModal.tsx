import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { createStudySession, getStudySessionByCode, joinStudySession, recordDailyActivity, startStudySession, endStudySession } from '../services/api'
import type { StudySession } from '../services/api'
import VideoRoom from './VideoRoom'
import './GroupStudyModal.css'

interface GroupStudyModalProps {
  onClose: () => void
  onSessionStarted?: () => void
}

type ViewMode = 'menu' | 'create' | 'join' | 'video'

export default function GroupStudyModal({ onClose, onSessionStarted }: GroupStudyModalProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [meetingCode, setMeetingCode] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  // Track study time only while in the video room
  useEffect(() => {
    if (!user || viewMode !== 'video') return

    startStudySession(user.id)
      .then(session => {
        sessionIdRef.current = session.id
        sessionStartRef.current = new Date()
      })
      .catch(err => console.error('Failed to start group study session:', err))

    return () => {
      if (sessionIdRef.current && sessionStartRef.current) {
        const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)
        if (duration >= 60) {
          endStudySession(sessionIdRef.current, duration, user.id)
            .catch(err => console.error('Failed to end group study session:', err))
        }
        sessionIdRef.current = null
        sessionStartRef.current = null
      }
    }
  }, [user, viewMode])

  const handleCreateMeeting = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { session, meetingCode } = await createStudySession(
        user.id,
        sessionTitle || t('groupStudy.defaultSessionTitle')
      )

      setCurrentSession(session)
      setGeneratedCode(meetingCode)
      setViewMode('create')
    } catch (err: any) {
      console.error('Create meeting error:', err)
      setError(err.message || t('groupStudy.errorCreateMeeting'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMeeting = async () => {
    if (!user) {
      setError(t('groupStudy.errorPleaseLogin'))
      return
    }

    const trimmedCode = meetingCode.trim()
    if (!trimmedCode || trimmedCode.length < 6) {
      setError(t('groupStudy.errorValidCode'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const session = await getStudySessionByCode(trimmedCode)

      if (!session) {
        setError(t('groupStudy.errorMeetingNotFound'))
        setLoading(false)
        return
      }

      await joinStudySession(session.id, user.id)
      setCurrentSession(session)
      await recordDailyActivity(user.id, 'group_study')
      onSessionStarted?.()
      setViewMode('video')
    } catch (err: any) {
      console.error('Join meeting error:', err)
      setError(err.message || t('groupStudy.errorJoinMeeting'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartVideo = async () => {
    if (user) {
      await recordDailyActivity(user.id, 'group_study')
    }
    onSessionStarted?.()
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
          <h2>{t('groupStudy.title')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {viewMode === 'menu' && (
            <div className="study-menu">
              <div className="menu-header">
                <h3>{t('groupStudy.studyWithFriends')}</h3>
                <p>{t('groupStudy.description')}</p>
              </div>

              <div className="menu-options">
                <div className="menu-option-card">
                  <div className="option-icon">✨</div>
                  <h4>{t('groupStudy.createMeeting')}</h4>
                  <p>{t('groupStudy.createDescription')}</p>
                  <input
                    type="text"
                    className="session-title-input"
                    placeholder={t('groupStudy.sessionTitlePlaceholder')}
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    maxLength={50}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleCreateMeeting}
                    disabled={loading}
                  >
                    {loading ? t('groupStudy.creating') : t('groupStudy.createButton')}
                  </button>
                </div>

                <div className="menu-divider">
                  <span>{t('groupStudy.or')}</span>
                </div>

                <div className="menu-option-card">
                  <div className="option-icon">🔗</div>
                  <h4>{t('groupStudy.joinMeeting')}</h4>
                  <p>{t('groupStudy.joinDescription')}</p>
                  <input
                    type="text"
                    className="meeting-code-input"
                    placeholder={t('groupStudy.codePlaceholder')}
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
                    {loading ? t('groupStudy.joining') : t('groupStudy.joinButton')}
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
              <h3>{t('groupStudy.meetingCreated')}</h3>
              <p>{t('groupStudy.shareCode')}</p>

              <div className="meeting-code-display">
                <div className="code-label">{t('groupStudy.meetingCode')}</div>
                <div className="code-value">{generatedCode}</div>
                <button
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode)
                    alert(t('groupStudy.codeCopied'))
                  }}
                >
                  {t('groupStudy.copyCode')}
                </button>
              </div>

              <div className="meeting-info">
                <p><strong>{t('groupStudy.session')}:</strong> {currentSession.title}</p>
                <p><strong>{t('groupStudy.host')}:</strong> {t('groupStudy.you')}</p>
              </div>

              <div className="meeting-actions">
                <button className="btn-start-video" onClick={handleStartVideo}>
                  {t('groupStudy.startVideo')}
                </button>
                <button className="btn-cancel" onClick={handleLeaveSession}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
