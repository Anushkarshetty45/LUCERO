import { useEffect, useRef } from 'react'
import { FaceDetectionResult } from '../../types/liveStudy'

interface VideoPreviewProps {
    stream: MediaStream | null
    videoRef: React.RefObject<HTMLVideoElement>
    faceResult: FaceDetectionResult
    showPreview: boolean
    modelsLoaded: boolean
}

export default function VideoPreview({
    stream,
    videoRef,
    faceResult,
    showPreview,
    modelsLoaded
}: VideoPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream, videoRef])

    if (!showPreview) return null

    return (
        <div className="video-preview-container">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`webcam-video ${!faceResult.faceDetected && modelsLoaded ? 'face-missing' : ''}`}
            />

            {/* Status Overlay */}
            <div className="video-overlay">
                {!modelsLoaded ? (
                    <div className="status-badge warning">
                        ⚠️ Basic Monitoring (Models Missing)
                    </div>
                ) : (
                    <>
                        <div className={`status-badge ${faceResult.faceDetected ? 'success' : 'warning'}`}>
                            {faceResult.faceDetected ? 'Face Detected' : 'No Face Detected'}
                        </div>

                        {faceResult.lookingDown && (
                            <div className="status-badge error">
                                Looking Down
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
        .video-preview-container {
          position: relative;
          width: 280px;
          height: 210px;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          border: 2px solid #333;
          transition: border-color 0.3s ease;
        }

        .webcam-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1); /* Mirror effect */
        }

        .webcam-video.face-missing {
          opacity: 0.7;
        }

        .video-overlay {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .status-badge.success {
          background: rgba(46, 204, 113, 0.8);
          color: white;
        }

        .status-badge.warning {
          background: rgba(241, 196, 15, 0.8);
          color: black;
        }

        .status-badge.error {
          background: rgba(231, 76, 60, 0.8);
          color: white;
        }
      `}</style>
        </div>
    )
}
