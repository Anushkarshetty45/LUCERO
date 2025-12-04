import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Distraction } from '../types/liveStudy'
import { useFaceDetection } from '../hooks/useFaceDetection'
import { useTabVisibility } from '../hooks/useTabVisibility'
import { playWarningSound, playTabSwitchWarning, getWarningLevel, getWarningMessage } from '../utils/warningSystem'

interface LiveStudyContextType {
    isActive: boolean
    setIsActive: (active: boolean) => void
    isMinimized: boolean
    setIsMinimized: (minimized: boolean) => void
    showLiveStudy: boolean
    setShowLiveStudy: (show: boolean) => void
    sessionTime: number
    focusScore: number
    distractions: Distraction[]
    startSession: () => Promise<void>
    stopSession: () => void
    videoRef: React.RefObject<HTMLVideoElement>
    stream: MediaStream | null
    faceResult: any
    modelsLoaded: boolean
    warningMessage: string | null
}

const LiveStudyContext = createContext<LiveStudyContextType | undefined>(undefined)

export function LiveStudyProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [showLiveStudy, setShowLiveStudy] = useState(false)
    const [sessionTime, setSessionTime] = useState(0)
    const [focusTime, setFocusTime] = useState(0)
    const [distractions, setDistractions] = useState<Distraction[]>([])
    const [warningMessage, setWarningMessage] = useState<string | null>(null)

    // Hooks
    const {
        stream,
        videoRef,
        faceResult,
        modelsLoaded,
        startWebcam,
        stopWebcam
    } = useFaceDetection(isActive)

    const { isTabVisible, tabSwitchCount, resetCount } = useTabVisibility()

    // Start session
    const startSession = async () => {
        // Resume audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (audioContext.state === 'suspended') {
            await audioContext.resume()
        }

        // Request Notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission()
        }

        await startWebcam()
        setIsActive(true)
        setSessionTime(0)
        setFocusTime(0)
        setDistractions([])
        resetCount()
    }

    // Stop session
    const stopSession = () => {
        setIsActive(false)
        stopWebcam()
        setShowLiveStudy(false)
        setIsMinimized(false)
    }

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isActive) {
            interval = setInterval(() => {
                setSessionTime(prev => prev + 1)

                // Calculate focus time (face detected + tab visible)
                // If models missing, assume face detected (fallback)
                const isFaceFocused = modelsLoaded ? (faceResult.faceDetected && !faceResult.lookingDown) : true

                if (isFaceFocused && isTabVisible) {
                    setFocusTime(prev => prev + 1)
                }
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isActive, faceResult, isTabVisible, modelsLoaded])

    // Distraction Handling: Tab Switching
    useEffect(() => {
        if (!isActive) return

        if (!isTabVisible) {
            playTabSwitchWarning()
            setWarningMessage(getWarningMessage('tab_switch'))

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ Distraction Alert!', {
                    body: 'Return to your study session immediately!',
                    icon: '/favicon.ico'
                })
            }

            const newDistraction: Distraction = {
                id: Date.now().toString(),
                type: 'tab_switch',
                timestamp: new Date(),
                duration: 0,
                severity: 'high',
                resolved: false
            }
            setDistractions(prev => [...prev, newDistraction])
        } else {
            setWarningMessage(null)
        }
    }, [isTabVisible, isActive])

    // Distraction Handling: Face Away
    useEffect(() => {
        if (!isActive || !stream || !modelsLoaded) return

        let timeout: NodeJS.Timeout

        if (!faceResult.faceDetected) {
            timeout = setTimeout(() => {
                const level = getWarningLevel(distractions.length)
                playWarningSound(level)
                setWarningMessage(getWarningMessage('face_away'))

                const newDistraction: Distraction = {
                    id: Date.now().toString(),
                    type: 'face_away',
                    timestamp: new Date(),
                    duration: 0,
                    severity: 'medium',
                    resolved: false
                }
                setDistractions(prev => [...prev, newDistraction])
            }, 3000)
        } else {
            setWarningMessage(null)
        }

        return () => clearTimeout(timeout)
    }, [faceResult.faceDetected, isActive, stream, distractions.length, modelsLoaded])

    const focusScore = sessionTime > 0
        ? Math.round((focusTime / sessionTime) * 100)
        : 100

    return (
        <LiveStudyContext.Provider value={{
            isActive,
            setIsActive,
            isMinimized,
            setIsMinimized,
            showLiveStudy,
            setShowLiveStudy,
            sessionTime,
            focusScore,
            distractions,
            startSession,
            stopSession,
            videoRef,
            stream,
            faceResult,
            modelsLoaded,
            warningMessage
        }}>
            {children}
        </LiveStudyContext.Provider>
    )
}

export function useLiveStudy() {
    const context = useContext(LiveStudyContext)
    if (context === undefined) {
        throw new Error('useLiveStudy must be used within a LiveStudyProvider')
    }
    return context
}
