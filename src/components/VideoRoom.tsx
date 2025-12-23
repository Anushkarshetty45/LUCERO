import { useEffect, useRef, useState } from 'react'
import { leaveStudySession, endStudySessionByHost, getProfile } from '../services/api'
import type { StudySession } from '../services/api'
import './VideoRoom.css'

interface VideoRoomProps {
  session: StudySession
  userId: string
  onLeave: () => void
  onClose: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export default function VideoRoom({ session, userId, onLeave, onClose }: VideoRoomProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<any>(null)
  const [isHost, setIsHost] = useState(false)
  const [userName, setUserName] = useState('Student')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsHost(session.host_user_id === userId)

    // Load user's name
    const loadUserName = async () => {
      try {
        const profile = await getProfile(userId)
        setUserName(profile.full_name || 'Student')
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadUserName()
  }, [session.host_user_id, userId])

  useEffect(() => {
    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(true)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://8x8.vc/vpaas-magic-cookie-7e92f88cc2544dca8c0e5d69a7b79a5f/external_api.js'
        script.async = true
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('Failed to load Jitsi script'))
        document.body.appendChild(script)
      })
    }

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript()

        if (!jitsiContainerRef.current) return

        const domain = '8x8.vc'
        const options = {
          roomName: `vpaas-magic-cookie-7e92f88cc2544dca8c0e5d69a7b79a5f/${session.room_name}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userName
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableInviteFunctions: false,
            enableClosePage: false,
            toolbarButtons: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'profile',
              'chat',
              'recording',
              'livestreaming',
              'etherpad',
              'sharedvideo',
              'settings',
              'raisehand',
              'videoquality',
              'filmstrip',
              'participants-pane',
              'tileview',
              'download',
              'help',
              'mute-everyone'
            ]
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#030510',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            TOOLBAR_ALWAYS_VISIBLE: false
          }
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options)

        // Event handlers
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          setLoading(false)
        })

        jitsiApiRef.current.addEventListener('readyToClose', () => {
          handleLeave()
        })

      } catch (error) {
        console.error('Error initializing Jitsi:', error)
        alert('Failed to initialize video call. Please try again.')
        onLeave()
      }
    }

    initializeJitsi()

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
      }
    }
  }, [session.room_name, userName])

  const handleLeave = async () => {
    try {
      await leaveStudySession(session.id, userId)
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
      }
      onLeave()
    } catch (error) {
      console.error('Error leaving session:', error)
      onLeave()
    }
  }

  const handleEndSession = async () => {
    if (!isHost) return

    const confirm = window.confirm(
      'Are you sure you want to end this session for everyone?'
    )

    if (!confirm) return

    try {
      await endStudySessionByHost(session.id, userId)
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
      }
      onClose()
    } catch (error) {
      console.error('Error ending session:', error)
      alert('Failed to end session. Please try again.')
    }
  }

  return (
    <div className="video-room-container">
      <div className="video-room-header">
        <div className="session-info">
          <h3>{session.title}</h3>
          <span className="meeting-code-badge">Code: {session.meeting_code}</span>
        </div>
        <div className="header-actions">
          {isHost && (
            <button className="btn-end-session" onClick={handleEndSession}>
              🛑 End Session for All
            </button>
          )}
          <button className="btn-leave" onClick={handleLeave}>
            👋 Leave
          </button>
        </div>
      </div>

      <div className="video-room-content">
        {loading && (
          <div className="video-loading">
            <div className="spinner"></div>
            <p>Connecting to video call...</p>
          </div>
        )}
        <div ref={jitsiContainerRef} className="jitsi-container" />
      </div>
    </div>
  )
}
