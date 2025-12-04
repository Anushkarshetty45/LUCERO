import { useLiveStudy } from '../../contexts/LiveStudyContext'
import VideoPreview from './VideoPreview'

export default function LiveStudySession() {
    const {
        isActive,
        sessionTime,
        focusScore,
        distractions,
        showLiveStudy,
        setShowLiveStudy,
        setIsMinimized,
        startSession,
        stopSession,
        videoRef,
        stream,
        faceResult,
        modelsLoaded,
        warningMessage
    } = useLiveStudy()

    if (!showLiveStudy) return null

    // Format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleMinimize = () => {
        setIsMinimized(true)
        setShowLiveStudy(false)
    }

    return (
        <div className="live-study-overlay">
            <div className="live-study-container">
                {/* Header */}
                <div className="live-header">
                    <div className="live-title">
                        <span className="live-indicator">●</span>
                        Live Study Session
                    </div>
                    <div className="header-controls">
                        <button className="minimize-btn" onClick={handleMinimize}>_</button>
                        <button className="close-btn" onClick={stopSession}>×</button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="live-content">
                    {/* Left: Video & Controls */}
                    <div className="live-controls-section">
                        <div className="video-wrapper">
                            {!isActive ? (
                                <div className="start-prompt">
                                    <div className="camera-icon">📷</div>
                                    <p>Enable camera to start live monitoring</p>
                                    <button className="start-btn" onClick={startSession}>
                                        Start Session
                                    </button>
                                </div>
                            ) : (
                                <VideoPreview
                                    stream={stream}
                                    videoRef={videoRef}
                                    faceResult={faceResult}
                                    showPreview={true}
                                    modelsLoaded={modelsLoaded}
                                />
                            )}
                        </div>

                        {isActive && (
                            <div className="controls-row">
                                <button
                                    className="control-btn"
                                    onClick={handleMinimize}
                                >
                                    Minimize
                                </button>
                                <button className="stop-btn" onClick={stopSession}>
                                    End Session
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Stats */}
                    <div className="live-stats-section">
                        <div className="stat-card timer-card">
                            <span className="stat-label">Session Time</span>
                            <span className="stat-value">{formatTime(sessionTime)}</span>
                        </div>

                        <div className="stat-card focus-card">
                            <span className="stat-label">Focus Score</span>
                            <div className="focus-ring" style={{
                                background: `conic-gradient(#4cd137 ${focusScore}%, #333 ${focusScore}%)`
                            }}>
                                <div className="focus-inner">
                                    {focusScore}%
                                </div>
                            </div>
                        </div>

                        <div className="stat-card distractions-card">
                            <span className="stat-label">Distractions</span>
                            <span className="stat-value">{distractions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Warning Overlay */}
                {warningMessage && (
                    <div className="warning-banner">
                        {warningMessage}
                    </div>
                )}
            </div>

            <style>{`
        .live-study-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .live-study-container {
          background: #1a1a1a;
          border-radius: 20px;
          width: 800px;
          max-width: 95vw;
          border: 1px solid #333;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .live-header {
          padding: 20px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-controls {
          display: flex;
          gap: 10px;
        }

        .live-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .live-indicator {
          color: #e74c3c;
          animation: pulse 2s infinite;
        }

        .minimize-btn, .close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
        }
        
        .minimize-btn {
          font-size: 20px;
          margin-top: -5px;
        }

        .live-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          padding: 30px;
        }

        .video-wrapper {
          width: 100%;
          height: 240px;
          background: #000;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .start-prompt {
          text-align: center;
          color: #888;
        }

        .camera-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .start-btn {
          margin-top: 15px;
          padding: 10px 24px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .start-btn:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .controls-row {
          display: flex;
          gap: 10px;
        }

        .control-btn {
          flex: 1;
          padding: 10px;
          background: #333;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .stop-btn {
          flex: 1;
          padding: 10px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .live-stats-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .stat-card {
          background: #252525;
          padding: 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .stat-label {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 5px;
        }

        .stat-value {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          font-family: monospace;
        }

        .focus-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        }

        .focus-inner {
          width: 70px;
          height: 70px;
          background: #252525;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .warning-banner {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #e74c3c;
          color: white;
          text-align: center;
          padding: 15px;
          font-weight: 600;
          animation: slideUp 0.3s ease;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}
