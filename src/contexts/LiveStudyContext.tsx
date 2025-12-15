import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { Distraction } from '../types/liveStudy'
import { useFaceDetection } from '../hooks/useFaceDetection'
import { useTabVisibility } from '../hooks/useTabVisibility'
import { playWarningSound, playTabSwitchWarning, playLoudAlarm, getWarningLevel, getWarningMessage } from '../utils/warningSystem'
import { useAuth } from '../hooks/useAuth'
import {
    createFocusEvent,
    createSessionAnalytics,
    checkAndUnlockAchievements,
    updateDailyStats,
    getDailyStats
} from '../services/api'

interface FocusMetrics {
    focusScore: number
    currentStreak: number
    longestStreak: number
    distractionCount: number
    totalFocusTime: number
    isFocused: boolean
}

interface SessionAnalytics {
    focusScore: number
    totalFocusedTime: number
    totalDistractedTime: number
    distractionCount: number
    longestFocusStreak: number
    averageFocusStreak: number
    focusTimeline: Array<{ timestamp: number; type: string; duration: number }>
}

interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    points: number
    rarity: string
}

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
    videoRef: React.RefObject<HTMLVideoElement | null>
    stream: MediaStream | null
    faceResult: any
    modelsLoaded: boolean
    warningMessage: string | null
    focusMetrics: FocusMetrics
    showSessionReport: boolean
    setShowSessionReport: (show: boolean) => void
    sessionAnalytics: SessionAnalytics | null
    unlockedAchievements: Achievement[]
}

const LiveStudyContext = createContext<LiveStudyContextType | undefined>(undefined)

export function LiveStudyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [isActive, setIsActive] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [showLiveStudy, setShowLiveStudy] = useState(false)
    const [sessionTime, setSessionTime] = useState(0)
    const [focusTime, setFocusTime] = useState(0)
    const [distractions, setDistractions] = useState<Distraction[]>([])
    const [warningMessage, setWarningMessage] = useState<string | null>(null)

    // Focus tracking state
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [currentStreak, setCurrentStreak] = useState(0)
    const [longestStreak, setLongestStreak] = useState(0)
    const [showSessionReport, setShowSessionReport] = useState(false)
    const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null)
    const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([])
    const [focusTimeline, setFocusTimeline] = useState<Array<{ timestamp: number; type: string; duration: number }>>([])
    const [lastFocusEventTime, setLastFocusEventTime] = useState<number>(Date.now())
    const [lastFocusState, setLastFocusState] = useState<boolean>(true)

    // Refs to track current state without restarting intervals
    const faceResultRef = useRef<any>({ faceDetected: true, lookingDown: false })
    const isTabVisibleRef = useRef(true)
    const modelsLoadedRef = useRef(false)

    // Hooks
    const {
        stream,
        videoRef,
        faceResult,
        modelsLoaded,
        startWebcam,
        stopWebcam
    } = useFaceDetection(isActive)

    const { isTabVisible, resetCount } = useTabVisibility()

    // Keep refs in sync
    useEffect(() => {
        faceResultRef.current = faceResult
    }, [faceResult])

    useEffect(() => {
        isTabVisibleRef.current = isTabVisible
    }, [isTabVisible])

    useEffect(() => {
        modelsLoadedRef.current = modelsLoaded
    }, [modelsLoaded])

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

        // Generate unique session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSessionId(newSessionId)

        // Reset all tracking state
        setIsActive(true)
        setSessionTime(0)
        setFocusTime(0)
        setDistractions([])
        setCurrentStreak(0)
        setLongestStreak(0)
        setFocusTimeline([])
        setLastFocusEventTime(Date.now())
        setLastFocusState(true)
        resetCount()
    }

    // Stop session
    const stopSession = async () => {
        // Calculate focus streaks from timeline
        const focusStreaks: number[] = []
        let currentStreakDuration = 0

        focusTimeline.forEach((event) => {
            if (event.type === 'focused') {
                currentStreakDuration += event.duration
            } else {
                if (currentStreakDuration > 0) {
                    focusStreaks.push(currentStreakDuration)
                    currentStreakDuration = 0
                }
            }
        })
        if (currentStreakDuration > 0) {
            focusStreaks.push(currentStreakDuration)
        }

        const longestFocusStreak = focusStreaks.length > 0 ? Math.max(...focusStreaks) : 0
        const averageFocusStreak = focusStreaks.length > 0
            ? focusStreaks.reduce((sum, s) => sum + s, 0) / focusStreaks.length
            : 0

        // Build analytics object
        const analytics: SessionAnalytics = {
            focusScore,
            totalFocusedTime: focusTime,
            totalDistractedTime: sessionTime - focusTime,
            distractionCount: distractions.length,
            longestFocusStreak,
            averageFocusStreak: Math.round(averageFocusStreak),
            focusTimeline
        }

        // Stop the session but keep it visible for the report
        setIsActive(false)
        stopWebcam()
        setIsMinimized(false)

        // Set analytics and show report
        setSessionAnalytics(analytics)
        setShowSessionReport(true)
        // Note: showLiveStudy stays true so modal can display
        // It will be set to false when user closes the modal

        // Try to save to database (non-blocking)
        if (user && sessionId) {
            try {
                // Save analytics to database
                await createSessionAnalytics(sessionId, user.id, analytics)

                // Check and unlock achievements
                const sessionData = {
                    focusScore,
                    focusStreak: longestFocusStreak,
                    duration: sessionTime,
                    distractionCount: distractions.length
                }
                const achievements = await checkAndUnlockAchievements(user.id, sessionData)
                setUnlockedAchievements(achievements)

                // Update daily stats
                const today = new Date().toISOString().split('T')[0]
                const existingStats = await getDailyStats(user.id, today)

                await updateDailyStats(user.id, today, {
                    totalStudyTime: (existingStats?.totalStudyTime || 0) + sessionTime,
                    totalFocusTime: (existingStats?.totalFocusTime || 0) + focusTime,
                    distractionsCount: (existingStats?.distractionsCount || 0) + distractions.length,
                    sessionsCount: (existingStats?.sessionsCount || 0) + 1,
                    averageFocusScore: focusScore
                })
            } catch (error) {
                console.error('Error saving session analytics:', error)
                // Modal still shows even if database save fails
            }
        }
    }

    // Timer logic - uses refs to avoid interval restarts
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isActive) {
            interval = setInterval(() => {
                setSessionTime(prev => prev + 1)

                // Calculate focus time using refs (stable values)
                const faceData = faceResultRef.current
                const tabVisible = isTabVisibleRef.current
                const hasModels = modelsLoadedRef.current

                // If models missing, assume face detected (fallback)
                const isFaceFocused = hasModels
                    ? (faceData.faceDetected && !faceData.lookingDown)
                    : true

                const isCurrentlyFocused = isFaceFocused && tabVisible

                if (isCurrentlyFocused) {
                    setFocusTime(prev => prev + 1)
                    setCurrentStreak(prev => {
                        const newStreak = prev + 1
                        setLongestStreak(current => Math.max(current, newStreak))
                        return newStreak
                    })
                } else {
                    setCurrentStreak(0)
                }
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isActive]) // Only depends on isActive now

    // Focus event tracking - record focus state changes every 5 seconds
    useEffect(() => {
        if (!isActive || !user || !sessionId) return

        const trackingInterval = setInterval(() => {
            const faceData = faceResultRef.current
            const tabVisible = isTabVisibleRef.current
            const hasModels = modelsLoadedRef.current

            const isFaceFocused = hasModels
                ? (faceData.faceDetected && !faceData.lookingDown)
                : true

            const isCurrentlyFocused = isFaceFocused && tabVisible

            // Track state changes and duration
            const now = Date.now()
            const duration = Math.round((now - lastFocusEventTime) / 1000)

            if (duration > 0) {
                const timelineEventType = lastFocusState ? 'focused' : 'distracted'

                // Map to database event types
                let dbEventType: 'face_detected' | 'face_lost' | 'looking_away' | 'resumed_focus'
                if (lastFocusState) {
                    dbEventType = 'face_detected'
                } else {
                    dbEventType = tabVisible ? 'looking_away' : 'face_lost'
                }

                // Add to timeline
                setFocusTimeline(prev => [...prev, {
                    timestamp: lastFocusEventTime,
                    type: timelineEventType,
                    duration
                }])

                // Save to database
                const confidence = hasModels ? 0.9 : 0.5
                createFocusEvent(sessionId, user.id, dbEventType, confidence, {
                    faceDetected: faceData.faceDetected,
                    lookingDown: faceData.lookingDown,
                    tabVisible
                }).catch(error => console.error('Error creating focus event:', error))
            }

            setLastFocusEventTime(now)
            setLastFocusState(isCurrentlyFocused)
        }, 5000) // Track every 5 seconds

        return () => clearInterval(trackingInterval)
    }, [isActive, user, sessionId, lastFocusEventTime, lastFocusState])

    // Distraction Handling: Tab Switching with ESCALATING warnings
    useEffect(() => {
        if (!isActive) return

        let warningInterval: NodeJS.Timeout
        let distractionStartTime: number

        if (!isTabVisible) {
            distractionStartTime = Date.now()

            // Immediate first warning (soft)
            playTabSwitchWarning()
            setWarningMessage(getWarningMessage('tab_switch'))

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ Distraction Alert!', {
                    body: 'Return to your study session immediately!',
                    icon: '/favicon.ico'
                })
            }

            // Log distraction once
            const newDistraction: Distraction = {
                id: Date.now().toString(),
                type: 'tab_switch',
                timestamp: new Date(),
                duration: 0,
                severity: 'high',
                resolved: false
            }
            setDistractions(prev => [...prev, newDistraction])

            // Escalating warnings - check every 3 seconds
            warningInterval = setInterval(() => {
                const elapsed = Date.now() - distractionStartTime

                if (elapsed > 5000) {
                    // After 5 seconds: LOUD alarm (3 rapid beeps)
                    playLoudAlarm()
                } else {
                    // First 5 seconds: soft beep
                    playTabSwitchWarning()
                }
            }, 3000)
        } else {
            setWarningMessage(null)
        }

        return () => {
            if (warningInterval) clearInterval(warningInterval)
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

    // Calculate real-time focus metrics
    const focusMetrics: FocusMetrics = {
        focusScore,
        currentStreak,
        longestStreak,
        distractionCount: distractions.length,
        totalFocusTime: focusTime,
        isFocused: currentStreak > 0
    }

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
            warningMessage,
            focusMetrics,
            showSessionReport,
            setShowSessionReport,
            sessionAnalytics,
            unlockedAchievements
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
