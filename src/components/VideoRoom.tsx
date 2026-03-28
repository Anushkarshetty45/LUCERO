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
        console.log('🚀 Initializing Jitsi video call...')
        console.log('📝 User name:', userName)
        console.log('🏠 Room name:', session.room_name)
        console.log('🆔 Session ID:', session.id)

        await loadJitsiScript()
        console.log('✅ Jitsi script loaded')

        if (!jitsiContainerRef.current) {
          console.error('❌ Jitsi container not found')
          return
        }

        const domain = 'meet.jit.si'
        const options = {
          roomName: `LuceroStudy_${session.room_name}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userName,
            email: '' // Optional: can be left empty
          },
          configOverwrite: {
            // Audio/Video settings - DO NOT mute by default
            startWithAudioMuted: false,
            startWithVideoMuted: false,

            // Enable prejoin page so users can test audio/video before joining
            prejoinPageEnabled: true,

            // UI settings
            enableWelcomePage: false,
            disableInviteFunctions: false,
            enableClosePage: false,

            // Enable tile view by default (Google Meet style grid)
            startInTileView: true,

            // Ensure participants can see each other
            disableModeratorIndicator: false,
            // Optimized video quality settings for better performance and aspect ratio
            resolution: 480,
            constraints: {
              video: {
                aspectRatio: 16 / 9,
                height: {
                  ideal: 480,
                  max: 720,
                  min: 180
                },
                width: {
                  ideal: 640,
                  max: 1280,
                  min: 320
                },
                frameRate: {
                  ideal: 24,
                  max: 30
                }
              }
            },
            // Performance optimizations
            disableAudioLevels: false,
            enableLayerSuspension: true,
            enableNoisyMicDetection: false,
            p2p: {
              enabled: true,
              stunServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
              ]
            },
            // Better video quality control
            videoQuality: {
              maxBitratesVideo: {
                low: 200000,
                standard: 500000,
                high: 1500000
              }
            },
            // Toolbar buttons - include essential controls
            toolbarButtons: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'hangup',
              'chat',
              'settings',
              'raisehand',
              'tileview',
              'participants-pane',
              'fodeviceselection' // Device selection for audio/video devices
            ]
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#030510',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            // Optimized grid view settings
            TILE_VIEW_MAX_COLUMNS: 3,
            VERTICAL_FILMSTRIP: false,
            // Better video aspect ratio handling
            FILM_STRIP_MAX_HEIGHT: 100,
            VIDEO_LAYOUT_FIT: 'both',
            // Longer toolbar timeout for less distraction
            INITIAL_TOOLBAR_TIMEOUT: 20000,
            TOOLBAR_TIMEOUT: 5000,
            // Disable animations for better performance
            DISABLE_VIDEO_BACKGROUND: true,
            // Better video quality
            VIDEO_QUALITY_LABEL_DISABLED: false
          }
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options)
        console.log('📡 Jitsi API created, waiting for connection...')

        // Listen for when iframe is ready
        jitsiApiRef.current.addEventListener('videoConferenceJoined', (event: any) => {
          console.log('✅ Successfully joined video conference:', event)
          setLoading(false)

          // Enable tile view (grid layout for Google Meet style)
          setTimeout(() => {
            try {
              if (jitsiApiRef.current) {
                // Execute command to enable tile view
                jitsiApiRef.current.executeCommand('toggleTileView')
                console.log('📹 Tile view enabled')

                // Get initial participant list
                const participants = jitsiApiRef.current.getParticipantsInfo()
                console.log('👥 Initial participants:', participants)

                if (participants && participants.length > 0) {
                  const participantList = participants.map((p: any) => ({
                    id: p.participantId,
                    name: p.displayName || 'Guest'
                  }))
                  setParticipants(participantList)
                }
              }
            } catch (e) {
              console.error('❌ Error enabling tile view:', e)
            }
          }, 1000)
        })

        jitsiApiRef.current.addEventListener('readyToClose', () => {
          handleLeave()
        })

        // Track participants
        jitsiApiRef.current.addEventListener('participantJoined', (event: any) => {
          const participantId = event.id
          const participantName = event.displayName || 'Guest'

          console.log('👋 Participant joined:', { id: participantId, name: participantName })

          setParticipants(prev => {
            // Check if participant already exists
            if (prev.find(p => p.id === participantId)) {
              return prev
            }
            return [...prev, { id: participantId, name: participantName }]
          })

          // Show notification
          const notification = document.createElement('div')
          notification.className = 'participant-notification'
          notification.textContent = `${participantName} joined`
          document.body.appendChild(notification)
          setTimeout(() => notification.remove(), 3000)
        })

        jitsiApiRef.current.addEventListener('participantLeft', (event: any) => {
          const participantId = event.id
          const participantName = event.displayName || 'Guest'

          console.log('👋 Participant left:', { id: participantId, name: participantName })

          setParticipants(prev => prev.filter(p => p.id !== participantId))

          // Show notification
          const notification = document.createElement('div')
          notification.className = 'participant-notification left'
          notification.textContent = `${participantName} left`
          document.body.appendChild(notification)
          setTimeout(() => notification.remove(), 3000)
        })

        // Track display name changes
        jitsiApiRef.current.addEventListener('displayNameChange', (event: any) => {
          console.log('📝 Display name changed:', event)
          const participantId = event.id
          const newName = event.displayname || 'Guest'

          setParticipants(prev =>
            prev.map(p => p.id === participantId ? { ...p, name: newName } : p)
          )
        })

        jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
          console.log('👋 Left conference')
          handleLeave()
        })

        // Listen for errors
        jitsiApiRef.current.addEventListener('errorOccurred', (error: any) => {
          console.error('❌ Jitsi error occurred:', error)
        })

        // Listen for audio/video mute events
        jitsiApiRef.current.addEventListener('audioMuteStatusChanged', (event: any) => {
          console.log('🎤 Audio mute status:', event.muted ? 'Muted' : 'Unmuted')
        })

        jitsiApiRef.current.addEventListener('videoMuteStatusChanged', (event: any) => {
          console.log('📹 Video mute status:', event.muted ? 'Muted' : 'Unmuted')
        })

        console.log('✅ Jitsi API initialized successfully')

      } catch (error) {
        console.error('❌ Error initializing Jitsi:', error)
        setLoading(false)
        alert('Failed to initialize video call. Please check your internet connection and try again.')
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
