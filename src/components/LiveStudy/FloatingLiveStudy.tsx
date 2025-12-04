import { useLiveStudy } from '../../contexts/LiveStudyContext'
import VideoPreview from './VideoPreview'

export default function FloatingLiveStudy() {
    const {
        isActive,
        isMinimized,
        setIsMinimized,
        setShowLiveStudy,
        sessionTime,
        stream,
        videoRef,
        faceResult,
        modelsLoaded,
        warningMessage
    } = useLiveStudy()

    if (!isActive || !isMinimized) return null

    const handleRestore = () => {
        setIsMinimized(false)
        setShowLiveStudy(true)
    }

    // Format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="floating-live-study" onClick={handleRestore}>
            <div className="floating-video-wrapper">
                <VideoPreview
                    stream={stream}
                    videoRef={videoRef}
                    faceResult={faceResult}
                    showPreview={true}
                    modelsLoaded={modelsLoaded}
                />
            </div>

            <div className="floating-info">
                <div className="floating-timer">
                    <span className="recording-dot">●</span>
                    {formatTime(sessionTime)}
                </div>
                {warningMessage && (
                    <div className="floating-warning">⚠️</div>
                )}
            </div>

            <style>{`
        .floating-live-study {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 180px;
          height: 135px;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border: 2px solid #333;
          cursor: pointer;
          z-index: 9999;
          transition: transform 0.2s;
        }

        .floating-live-study:hover {
          transform: scale(1.05);
          border-color: #3498db;
        }

        .floating-video-wrapper {
          width: 100%;
          height: 100%;
        }
        
        /* Override VideoPreview styles for floating widget */
        .floating-video-wrapper .video-preview-container {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          border-radius: 0 !important;
        }

        .floating-info {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .floating-timer {
          background: rgba(0, 0, 0, 0.7);
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(4px);
        }

        .recording-dot {
          color: #e74c3c;
          animation: pulse 2s infinite;
          font-size: 10px;
        }

        .floating-warning {
          font-size: 16px;
          animation: bounce 1s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
        </div>
    )
}
