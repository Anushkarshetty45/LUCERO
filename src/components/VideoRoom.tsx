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
  const [participants, setParticipants] = useState<Array<{ id: string; name: string }>>([])
  const [showParticipants, setShowParticipants] = useState(false)

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
        script.src = 'https://meet.jit.si/external_api.js'
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

        const domain = 'meet.jit.si'
        const options = {
          roomName: `LuceroStudy_${session.room_name}`,
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
            // Enable tile view by default (Google Meet style grid)
            startInTileView: true,
            // Ensure participants can see each other
            disableModeratorIndicator: false,
            // Video quality settings
            resolution: 720,
            constraints: {
              video: {
                height: {
                  ideal: 720,
                  max: 1080,
                  min: 240
                }
              }
            },
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
            TOOLBAR_ALWAYS_VISIBLE: true,
            // Grid view settings for better participant visibility
            TILE_VIEW_MAX_COLUMNS: 4,
            VERTICAL_FILMSTRIP: false,
            // Ensure video is prominent
            FILM_STRIP_MAX_HEIGHT: 120,
            INITIAL_TOOLBAR_TIMEOUT: 20000,
            TOOLBAR_TIMEOUT: 4000
          }
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options)

        // Event handlers
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          setLoading(false)

          // Ensure tile view is enabled (grid layout for Google Meet style)
          // Give it a small delay to ensure the API is fully ready
          setTimeout(() => {
            try {
              // Check if tile view is already enabled
              jitsiApiRef.current.isVideoAvailable().then((available: boolean) => {
                if (available) {
                  console.log('Video is available, tile view should be active')
                }
              })
            } catch (e) {
              console.log('Error checking video availability:', e)
            }
          }, 500)
        })

        jitsiApiRef.current.addEventListener('readyToClose', () => {
          handleLeave()
        })

        // Track participants
        jitsiApiRef.current.addEventListener('participantJoined', (participant: any) => {
          console.log('Participant joined:', participant.displayName)
          setParticipants(prev => {
            // Check if participant already exists
            if (prev.find(p => p.id === participant.id)) {
              return prev
            }
            return [...prev, { id: participant.id, name: participant.displayName }]
          })

          // Show notification
          const notification = document.createElement('div')
          notification.className = 'participant-notification'
          notification.textContent = `${participant.displayName} joined`
          document.body.appendChild(notification)
          setTimeout(() => notification.remove(), 3000)
        })

        jitsiApiRef.current.addEventListener('participantLeft', (participant: any) => {
          console.log('Participant left:', participant.displayName)
          setParticipants(prev => prev.filter(p => p.id !== participant.id))

          // Show notification
          const notification = document.createElement('div')
          notification.className = 'participant-notification left'
          notification.textContent = `${participant.displayName} left`
          document.body.appendChild(notification)
          setTimeout(() => notification.remove(), 3000)
        })

        jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
          console.log('Left conference')
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
          <button
            className="participants-badge"
            onClick={() => setShowParticipants(!showParticipants)}
            title="View participants"
          >
            👥 {participants.length + 1} {participants.length === 0 ? 'participant' : 'participants'}
          </button>
        </div>
        <div className="header-actions">
          {isHost && (
            <button className="btn-end-session" onClick={handleEndSession}>
              End for All
            </button>
          )}
          <button className="btn-leave" onClick={handleLeave}>
            Leave
          </button>
        </div>
      </div>

      {showParticipants && (
        <div className="participants-list">
          <h4>Participants ({participants.length + 1})</h4>
          <ul>
            <li className="participant-item you">
              <span className="participant-name">{userName}</span>
              <span className="you-badge">You</span>
              {isHost && <span className="host-badge">Host</span>}
            </li>
            {participants.map(p => (
              <li key={p.id} className="participant-item">
                <span className="participant-name">{p.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
