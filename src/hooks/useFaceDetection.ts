import { useState, useEffect, useRef, useCallback } from 'react'
import { detectFace, isLookingDown, isTalking, isHoldingPhone, loadFaceDetectionModels } from '../utils/faceDetectionSetup'
import { FaceDetectionResult } from '../types/liveStudy'

export function useFaceDetection(isActive: boolean) {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [faceResult, setFaceResult] = useState<FaceDetectionResult>({
        faceDetected: false,
        lookingDown: false,
        isTalking: false,
        holdingPhone: false,
        confidence: 0
    })
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement | null>(null)
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Load models on mount
    useEffect(() => {
        loadFaceDetectionModels()
            .then(() => setModelsLoaded(true))
            .catch(err => setError('Failed to load face detection models'))
    }, [])

    // Start webcam
    const startWebcam = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            })
            setStream(mediaStream)
            setError(null)
        } catch (err) {
            setError('Camera access denied')
            console.error('Error accessing webcam:', err)
        }
    }, [])

    // Stop webcam
    const stopWebcam = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }, [stream])

    // Run face detection
    const runDetection = useCallback(async () => {
        if (!videoRef.current) return

        // If models aren't loaded, we can't detect faces.
        // Fallback: Assume face is present if video is playing to prevent constant warnings.
        if (!modelsLoaded) {
            setFaceResult({
                faceDetected: true, // Fallback to true so user can use other features
                lookingDown: false,
                isTalking: false,
                holdingPhone: false,
                confidence: 1
            })
            return
        }

        try {
            const detection = await detectFace(videoRef.current)

            if (detection) {
                const lookingDownResult = detection.landmarks
                    ? isLookingDown(detection.landmarks)
                    : false

                const talkingResult = detection.landmarks
                    ? isTalking(detection.landmarks)
                    : false

                const phoneResult = detection.landmarks
                    ? isHoldingPhone(detection.landmarks)
                    : false

                setFaceResult({
                    faceDetected: true,
                    lookingDown: lookingDownResult,
                    isTalking: talkingResult,
                    holdingPhone: phoneResult,
                    confidence: detection.detection.score
                })
            } else {
                setFaceResult({
                    faceDetected: false,
                    lookingDown: false,
                    isTalking: false,
                    holdingPhone: false,
                    confidence: 0
                })
            }
        } catch (err) {
            console.error('Detection error:', err)
            // On error, fallback to true to avoid annoyance
            setFaceResult({
                faceDetected: true,
                lookingDown: false,
                isTalking: false,
                holdingPhone: false,
                confidence: 0
            })
        }
    }, [modelsLoaded])

    // Start/stop detection loop
    useEffect(() => {
        if (isActive && stream && modelsLoaded) {
            // Run detection every 300ms
            detectionIntervalRef.current = setInterval(runDetection, 300)
        } else {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current)
                detectionIntervalRef.current = null
            }
        }

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current)
            }
        }
    }, [isActive, stream, modelsLoaded, runDetection])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam()
        }
    }, [stopWebcam])

    return {
        stream,
        videoRef,
        faceResult,
        modelsLoaded,
        error,
        startWebcam,
        stopWebcam
    }
}
