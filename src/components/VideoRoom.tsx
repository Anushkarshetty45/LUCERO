import { useEffect, useRef, useState, useCallback } from 'react'
import Peer, { MediaConnection } from 'peerjs'
import { supabase } from '../services/supabase'
import { leaveStudySession, endStudySessionByHost, getProfile } from '../services/api'
import type { StudySession } from '../services/api'
import './VideoRoom.css'

interface VideoRoomProps {
  session: StudySession
  userId: string
  onLeave: () => void
  onClose: () => void
}

interface RemoteStream {
  peerId: string
  stream: MediaStream
  name: string
  handRaised?: boolean
  videoOff?: boolean
  isScreenShare?: boolean
}

interface ChatMessage {
  id: string
  sender: string
  text: string
  time: string
}

type SidePanel = 'none' | 'chat' | 'participants' | 'settings'

export default function VideoRoom({ session, userId, onLeave, onClose }: VideoRoomProps) {
  const [isHost] = useState(session.host_user_id === userId)

  // Pre-join state
  const [phase, setPhase] = useState<'prejoin' | 'room'>('prejoin')
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState('')
  const prejoinVideoRef = useRef<HTMLVideoElement>(null)
  const prejoinStreamRef = useRef<MediaStream | null>(null)

  // Room state
  const [connecting, setConnecting] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState('')
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>('none')
  const [unreadChat, setUnreadChat] = useState(0)

  const screenTrackRef = useRef<MediaStreamTrack | null>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Settings state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedMic, setSelectedMic] = useState('')

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<Peer | null>(null)
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map())
  const channelRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const displayNameRef = useRef('')

  const myPeerId = `luc-${session.id.replace(/-/g, '').slice(0, 10)}-${userId.replace(/-/g, '').slice(0, 8)}`
  const channelName = `gstudy-${session.id}`

  // ── Pre-join: start preview camera ──────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    const startPreview = async () => {
      try {
        // Load name from profile as default
        const profile = await getProfile(userId).catch(() => null)
        const name = profile?.full_name || profile?.first_name || profile?.email?.split('@')[0] || ''
        if (mountedRef.current) setDisplayName(name)

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        prejoinStreamRef.current = stream
        if (prejoinVideoRef.current) prejoinVideoRef.current.srcObject = stream

        // Enumerate devices for settings
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (mountedRef.current) {
          const cams = devices.filter(d => d.kind === 'videoinput')
          const micsArr = devices.filter(d => d.kind === 'audioinput')
          setCameras(cams)
          setMics(micsArr)
          if (cams[0]) setSelectedCamera(cams[0].deviceId)
          if (micsArr[0]) setSelectedMic(micsArr[0].deviceId)
        }
      } catch {}
    }

    startPreview()

    return () => {
      mountedRef.current = false
      prejoinStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join room ────────────────────────────────────────────────────────────────
  const handleJoinRoom = () => {
    const name = displayName.trim()
    if (!name) { setNameError('Please enter your name'); return }
    displayNameRef.current = name

    // Transfer preview stream to room
    const stream = prejoinStreamRef.current
    if (stream) {
      localStreamRef.current = stream
      prejoinStreamRef.current = null
    }

    setPhase('room')
  }

  // ── Room init (runs after phase changes to 'room') ───────────────────────────
  useEffect(() => {
    if (phase !== 'room') return
    mountedRef.current = true
    let connectTimeout: ReturnType<typeof setTimeout>

    const init = async () => {
      // Get camera if not already available
      let stream = localStreamRef.current
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          localStreamRef.current = stream
        } catch (err: any) {
          if (mountedRef.current) {
            setError(err.name === 'NotAllowedError'
              ? 'Camera access denied. Please allow access in your browser settings.'
              : 'Could not access camera/microphone.')
            setConnecting(false)
          }
          return
        }
      }

      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      if (mountedRef.current) setCameraReady(true)

      connectTimeout = setTimeout(() => {
        if (mountedRef.current) setConnecting(false)
      }, 10000)

      try {
        const peer = new Peer(myPeerId, {
          secure: true, host: '0.peerjs.com', port: 443, path: '/', debug: 0,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
        })
        peerRef.current = peer

        peer.on('open', (id) => {
          clearTimeout(connectTimeout)
          if (!mountedRef.current) return
          setConnecting(false)

          peer.on('call', (call) => {
            if (!localStreamRef.current) return
            call.answer(localStreamRef.current)
            const rid = call.peer
            const rname = call.metadata?.name || 'Student'
            connectionsRef.current.set(rid, call)
            call.on('stream', (s) => {
              addRemoteStream(rid, s, rname)
              if (mountedRef.current) setParticipants(p => p.find(x => x.peerId === rid) ? p : [...p, { peerId: rid, name: rname }])
            })
            call.on('close', () => { removeRemoteStream(rid); connectionsRef.current.delete(rid) })
          })

          // Supabase realtime: presence (video) + broadcast (chat + raise hand)
          const channel = supabase.channel(channelName, { config: { presence: { key: id } } })
          channelRef.current = channel

          channel
            .on('presence', { event: 'sync' }, () => {
              const state = channel.presenceState() as Record<string, any[]>
              const others = Object.entries(state).filter(([k]) => k !== id)
                .map(([k, v]) => ({ peerId: k, name: (v[0] as any)?.name || 'Student' }))
              if (mountedRef.current) setParticipants(others)
              others.forEach(({ peerId, name }) => callPeer(peer, stream!, peerId, name))
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
              if (key === id || !mountedRef.current) return
              const name = newPresences[0]?.name || 'Student'
              setParticipants(p => p.find(x => x.peerId === key) ? p : [...p, { peerId: key, name }])
              // System message
              addSystemMessage(`${name} joined`)
              setTimeout(() => callPeer(peer, stream!, key, name), 1000)
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
              const name = (leftPresences?.[0] as any)?.name || 'Someone'
              if (mountedRef.current) {
                removeRemoteStream(key)
                addSystemMessage(`${name} left`)
              }
            })
            .on('broadcast', { event: 'chat' }, ({ payload }: any) => {
              if (!mountedRef.current) return
              setMessages(prev => [...prev, payload as ChatMessage])
              setUnreadChat(u => sidePanel === 'chat' ? u : u + 1)
            })
            .on('broadcast', { event: 'raise_hand' }, ({ payload }: any) => {
              if (!mountedRef.current) return
              setRemoteStreams(prev => prev.map(s => s.peerId === payload.peerId ? { ...s, handRaised: payload.raised } : s))
            })
            .on('broadcast', { event: 'video_state' }, ({ payload }: any) => {
              if (!mountedRef.current) return
              setRemoteStreams(prev => prev.map(s => s.peerId === payload.peerId ? { ...s, videoOff: payload.videoOff } : s))
            })
            .on('broadcast', { event: 'screen_share' }, ({ payload }: any) => {
              if (!mountedRef.current) return
              setRemoteStreams(prev => prev.map(s => s.peerId === payload.peerId ? { ...s, isScreenShare: payload.active } : s))
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                await channel.track({ name: displayNameRef.current, peerId: id })
              }
            })
        })

        peer.on('error', () => {
          clearTimeout(connectTimeout)
          if (mountedRef.current) setConnecting(false)
        })
      } catch {
        clearTimeout(connectTimeout)
        if (mountedRef.current) setConnecting(false)
      }
    }

    init()

    return () => {
      mountedRef.current = false
      clearTimeout(connectTimeout)
      channelRef.current?.unsubscribe()
      connectionsRef.current.forEach(c => c.close())
      connectionsRef.current.clear()
      peerRef.current?.destroy()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const [participants, setParticipants] = useState<Array<{ peerId: string; name: string }>>([])

  const addRemoteStream = useCallback((peerId: string, stream: MediaStream, name: string) => {
    setRemoteStreams(prev => prev.find(s => s.peerId === peerId) ? prev : [...prev, { peerId, stream, name }])
  }, [])

  const removeRemoteStream = useCallback((peerId: string) => {
    setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId))
    setParticipants(prev => prev.filter(p => p.peerId !== peerId))
  }, [])

  const callPeer = useCallback((peer: Peer, stream: MediaStream, remotePeerId: string, remoteName: string) => {
    if (connectionsRef.current.has(remotePeerId)) return
    const call = peer.call(remotePeerId, stream, { metadata: { name: displayNameRef.current } })
    if (!call) return
    connectionsRef.current.set(remotePeerId, call)
    call.on('stream', (s) => addRemoteStream(remotePeerId, s, remoteName))
    call.on('close', () => { removeRemoteStream(remotePeerId); connectionsRef.current.delete(remotePeerId) })
    call.on('error', () => { removeRemoteStream(remotePeerId); connectionsRef.current.delete(remotePeerId) })
  }, [addRemoteStream, removeRemoteStream])

  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: '', text, time: '' }])
  }

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear unread when chat opens
  useEffect(() => {
    if (sidePanel === 'chat') setUnreadChat(0)
  }, [sidePanel])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    channelRef.current?.unsubscribe()
    connectionsRef.current.forEach(c => c.close())
    peerRef.current?.destroy()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    try { await leaveStudySession(session.id, userId) } catch {}
    onLeave()
  }

  const handleEndSession = async () => {
    if (!isHost || !window.confirm('End this session for everyone?')) return
    channelRef.current?.unsubscribe()
    connectionsRef.current.forEach(c => c.close())
    peerRef.current?.destroy()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    try { await endStudySessionByHost(session.id, userId) } catch {}
    onClose()
  }

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(m => !m)
  }

  const toggleVideo = () => {
    const nextOff = !isVideoOff
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !nextOff })
    setIsVideoOff(nextOff)
    channelRef.current?.send({ type: 'broadcast', event: 'video_state', payload: { peerId: myPeerId, videoOff: nextOff } })
  }

  const stopScreenShare = (cameraTrack: MediaStreamTrack | null) => {
    screenTrackRef.current?.stop()
    screenTrackRef.current = null
    setIsScreenSharing(false)
    // Restore camera track in all peer connections
    if (cameraTrack) {
      connectionsRef.current.forEach(call => {
        const sender = (call.peerConnection as any)?.getSenders?.()?.find((s: any) => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(cameraTrack)
      })
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
    }
    channelRef.current?.send({ type: 'broadcast', event: 'screen_share', payload: { peerId: myPeerId, active: false } })
    channelRef.current?.send({ type: 'broadcast', event: 'video_state', payload: { peerId: myPeerId, videoOff: isVideoOff } })
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null
      stopScreenShare(cameraTrack)
      return
    }
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false })
      const screenTrack: MediaStreamTrack = screenStream.getVideoTracks()[0]
      screenTrackRef.current = screenTrack
      setIsScreenSharing(true)

      // Replace video track in all peer connections
      connectionsRef.current.forEach(call => {
        const sender = (call.peerConnection as any)?.getSenders?.()?.find((s: any) => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(screenTrack)
      })

      // Show screen share in local preview
      if (localVideoRef.current) {
        const previewStream = new MediaStream([screenTrack, ...(localStreamRef.current?.getAudioTracks() ?? [])])
        localVideoRef.current.srcObject = previewStream
      }

      // Auto-stop when user clicks browser's "Stop sharing"
      screenTrack.onended = () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null
        stopScreenShare(cameraTrack)
      }
      channelRef.current?.send({ type: 'broadcast', event: 'screen_share', payload: { peerId: myPeerId, active: true } })
    } catch {
      // User cancelled or permission denied — do nothing
    }
  }

  const toggleHand = () => {
    const raised = !handRaised
    setHandRaised(raised)
    channelRef.current?.send({ type: 'broadcast', event: 'raise_hand', payload: { peerId: myPeerId, raised } })
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || !channelRef.current) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: displayNameRef.current || displayName,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, msg])
    setChatInput('')
    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg })
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId)
    const stream = localStreamRef.current
    if (!stream) return
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
      })
      const newVideoTrack = newStream.getVideoTracks()[0]
      // Replace track in all peer connections
      connectionsRef.current.forEach(call => {
        const sender = (call.peerConnection as any)?.getSenders?.()?.find((s: any) => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(newVideoTrack)
      })
      stream.getVideoTracks().forEach(t => t.stop())
      const newLocalStream = new MediaStream([newVideoTrack, ...stream.getAudioTracks()])
      localStreamRef.current = newLocalStream
      if (localVideoRef.current) localVideoRef.current.srcObject = newLocalStream
    } catch {}
  }

  const switchMic = async (deviceId: string) => {
    setSelectedMic(deviceId)
    const stream = localStreamRef.current
    if (!stream) return
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false
      })
      const newAudioTrack = newStream.getAudioTracks()[0]
      connectionsRef.current.forEach(call => {
        const sender = (call.peerConnection as any)?.getSenders?.()?.find((s: any) => s.track?.kind === 'audio')
        if (sender) sender.replaceTrack(newAudioTrack)
      })
      stream.getAudioTracks().forEach(t => t.stop())
      const newLocalStream = new MediaStream([...stream.getVideoTracks(), newAudioTrack])
      localStreamRef.current = newLocalStream
      if (localVideoRef.current) localVideoRef.current.srcObject = newLocalStream
    } catch {}
  }

  const togglePanel = (panel: SidePanel) => setSidePanel(p => p === panel ? 'none' : panel)
  const totalParticipants = remoteStreams.length + 1

  // ── Pre-join screen ──────────────────────────────────────────────────────────
  if (phase === 'prejoin') {
    return (
      <div className="prejoin-container" data-theme="dark">
        <div className="prejoin-card">
          <h2 className="prejoin-title">Ready to join?</h2>
          <p className="prejoin-session">{session.title} · Code: <strong>{session.meeting_code}</strong></p>

          <div className="prejoin-preview">
            <video ref={prejoinVideoRef} autoPlay muted playsInline className="prejoin-video" />
            <div className="prejoin-preview-label">Camera preview</div>
          </div>

          <div className="prejoin-field">
            <label>Your name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setNameError('') }}
              placeholder="Enter your display name"
              maxLength={40}
              onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              autoFocus
            />
            {nameError && <span className="prejoin-error">{nameError}</span>}
          </div>

          <div className="prejoin-actions">
            <button className="prejoin-btn-join" onClick={handleJoinRoom}>
              Join Now
            </button>
            <button className="prejoin-btn-cancel" onClick={() => {
              prejoinStreamRef.current?.getTracks().forEach(t => t.stop())
              onLeave()
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Room ─────────────────────────────────────────────────────────────────────
  return (
    <div className="video-room-container" data-theme="dark">
      {/* Header */}
      <div className="video-room-header">
        <div className="session-info">
          <h3>{session.title}</h3>
          <span className="meeting-code-badge">Code: {session.meeting_code}</span>
          <span className="participants-count">👥 {totalParticipants}</span>
        </div>
        <div className="header-actions">
          {isHost && <button className="btn-end-session" onClick={handleEndSession}>End for All</button>}
          <button className="btn-leave" onClick={handleLeave}>Leave</button>
        </div>
      </div>

      {/* Main layout */}
      <div className={`room-layout${sidePanel !== 'none' ? ' panel-open' : ''}`}>
        {/* Video area */}
        <div className="video-room-content">
          {error ? (
            <div className="video-error">
              <p>⚠️ {error}</p>
              <button onClick={handleLeave} className="btn-leave">Leave Room</button>
            </div>
          ) : (
            <div className={`video-grid participants-${Math.min(totalParticipants, 4)}`}>
              {/* Local tile */}
              <div className={`video-tile local-tile${isScreenSharing ? ' screen-share-tile' : ''}`}>
                {!cameraReady && (
                  <div className="video-connecting"><div className="spinner" /><p>Starting camera…</p></div>
                )}
                <video ref={localVideoRef} autoPlay muted playsInline style={{ display: isVideoOff ? 'none' : 'block' }} />
                {isVideoOff && cameraReady && <div className="video-avatar">{displayName.charAt(0).toUpperCase()}</div>}
                {cameraReady && (
                  <div className="video-label">
                    {displayName} (You){isHost ? ' · Host' : ''}
                    {isMuted && ' 🔇'}{handRaised && ' ✋'}
                  </div>
                )}
                {connecting && cameraReady && <div className="video-connecting-overlay">Connecting to others…</div>}
              </div>

              {/* Remote tiles */}
              {remoteStreams.map(({ peerId, stream, name, handRaised: hr, videoOff: vo, isScreenShare: ss }) => (
                <RemoteTile key={peerId} stream={stream} name={name} handRaised={!!hr} videoOff={!!vo} isScreenShare={!!ss} />
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        {sidePanel !== 'none' && (
          <div className="side-panel">
            <div className="side-panel-header">
              <span>
                {sidePanel === 'chat' && 'Chat'}
                {sidePanel === 'participants' && 'Participants'}
                {sidePanel === 'settings' && 'Settings'}
              </span>
              <button className="side-panel-close" onClick={() => setSidePanel('none')}>✕</button>
            </div>

            {/* Chat panel */}
            {sidePanel === 'chat' && (
              <div className="chat-panel">
                <div className="chat-messages">
                  {messages.length === 0 && (
                    <div className="chat-empty">No messages yet. Say hello! 👋</div>
                  )}
                  {messages.map(msg => (
                    msg.sender === '' ? (
                      <div key={msg.id} className="chat-system">{msg.text}</div>
                    ) : (
                      <div key={msg.id} className={`chat-bubble ${msg.sender === (displayNameRef.current || displayName) ? 'own' : ''}`}>
                        <div className="chat-bubble-name">{msg.sender}</div>
                        <div className="chat-bubble-text">{msg.text}</div>
                        {msg.time && <div className="chat-bubble-time">{msg.time}</div>}
                      </div>
                    )
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="chat-input-row">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message…"
                    maxLength={500}
                  />
                  <button onClick={sendChat} disabled={!chatInput.trim()}>Send</button>
                </div>
              </div>
            )}

            {/* Participants panel */}
            {sidePanel === 'participants' && (
              <div className="participants-panel">
                <ul className="participants-list-inner">
                  <li className="participant-item you">
                    <div className="participant-avatar">{displayName.charAt(0).toUpperCase()}</div>
                    <span className="participant-name">{displayName}</span>
                    <div className="participant-badges">
                      <span className="you-badge">You</span>
                      {isHost && <span className="host-badge">Host</span>}
                      {handRaised && <span className="hand-badge">✋</span>}
                    </div>
                  </li>
                  {participants.map(p => (
                    <li key={p.peerId} className="participant-item">
                      <div className="participant-avatar">{p.name.charAt(0).toUpperCase()}</div>
                      <span className="participant-name">{p.name}</span>
                      {remoteStreams.find(r => r.peerId === p.peerId)?.handRaised && (
                        <span className="hand-badge">✋</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Settings panel */}
            {sidePanel === 'settings' && (
              <div className="settings-panel">
                <div className="settings-group">
                  <label>Camera</label>
                  <select value={selectedCamera} onChange={e => switchCamera(e.target.value)}>
                    {cameras.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}`}</option>
                    ))}
                  </select>
                </div>

                <div className="settings-group">
                  <label>Microphone</label>
                  <select value={selectedMic} onChange={e => switchMic(e.target.value)}>
                    {mics.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 6)}`}</option>
                    ))}
                  </select>
                </div>

                <div className="settings-group">
                  <label>Audio</label>
                  <div className="settings-toggle-row">
                    <span>Microphone {isMuted ? 'muted' : 'active'}</span>
                    <button className={`settings-toggle ${isMuted ? 'off' : 'on'}`} onClick={toggleMute}>
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>
                </div>

                <div className="settings-group">
                  <label>Video</label>
                  <div className="settings-toggle-row">
                    <span>Camera {isVideoOff ? 'off' : 'on'}</span>
                    <button className={`settings-toggle ${isVideoOff ? 'off' : 'on'}`} onClick={toggleVideo}>
                      {isVideoOff ? 'Turn On' : 'Turn Off'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      {(cameraReady || error) && (
        <div className="video-controls">
          <button className={`ctrl-btn ${isMuted ? 'ctrl-btn--off' : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? '🔇' : '🎤'}<span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button className={`ctrl-btn ${isVideoOff ? 'ctrl-btn--off' : ''}`} onClick={toggleVideo} title={isVideoOff ? 'Start Video' : 'Stop Video'}>
            {isVideoOff ? '📵' : '📹'}<span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>
          <button className={`ctrl-btn ${isScreenSharing ? 'ctrl-btn--active ctrl-btn--sharing' : ''}`} onClick={toggleScreenShare} title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
            🖥️<span>{isScreenSharing ? 'Stop Share' : 'Share'}</span>
          </button>
          <button className={`ctrl-btn ${handRaised ? 'ctrl-btn--active' : ''}`} onClick={toggleHand} title="Raise Hand">
            ✋<span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>
          <div className="ctrl-divider" />
          <button className={`ctrl-btn ${sidePanel === 'chat' ? 'ctrl-btn--active' : ''}`} onClick={() => togglePanel('chat')} title="Chat">
            💬<span>Chat{unreadChat > 0 && <span className="chat-badge">{unreadChat}</span>}</span>
          </button>
          <button className={`ctrl-btn ${sidePanel === 'participants' ? 'ctrl-btn--active' : ''}`} onClick={() => togglePanel('participants')} title="Participants">
            👥<span>People</span>
          </button>
          <button className={`ctrl-btn ${sidePanel === 'settings' ? 'ctrl-btn--active' : ''}`} onClick={() => togglePanel('settings')} title="Settings">
            ⚙️<span>Settings</span>
          </button>
          <div className="ctrl-divider" />
          <button className="ctrl-btn ctrl-btn--hangup" onClick={handleLeave}>
            📵<span>Leave</span>
          </button>
        </div>
      )}
    </div>
  )
}

function RemoteTile({ stream, name, handRaised, videoOff, isScreenShare }: { stream: MediaStream; name: string; handRaised: boolean; videoOff: boolean; isScreenShare: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div className={`video-tile${isScreenShare ? ' screen-share-tile' : ''}`}>
      <video ref={videoRef} autoPlay playsInline style={{ display: videoOff ? 'none' : 'block' }} />
      {videoOff && (
        <div className="video-avatar-container">
          <div className="video-avatar video-avatar--large">{name.charAt(0).toUpperCase()}</div>
          <div className="video-camera-off-label">Camera off</div>
        </div>
      )}
      <div className="video-label">{name}{handRaised && ' ✋'}</div>
    </div>
  )
}
