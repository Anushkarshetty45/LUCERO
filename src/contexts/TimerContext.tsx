import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef } from 'react'
import { useTimer } from '../hooks/useTimer'
import { useAuth } from '../hooks/useAuth'
import { startStudySession, endStudySession } from '../services/api'

interface TimerContextType {
    timer: ReturnType<typeof useTimer>
    isMinimized: boolean
    setIsMinimized: (minimized: boolean) => void
    showTimerModal: boolean
    setShowTimerModal: (show: boolean) => void
}

const TimerContext = createContext<TimerContextType | null>(null)

export function useTimerContext() {
    const context = useContext(TimerContext)
    if (!context) {
        throw new Error('useTimerContext must be used within TimerProvider')
    }
    return context
}

interface TimerProviderProps {
    children: ReactNode
}

export function TimerProvider({ children }: TimerProviderProps) {
    const timer = useTimer()
    const { user } = useAuth()
    const [isMinimized, setIsMinimized] = useState(false)
    const [showTimerModal, setShowTimerModal] = useState(false)

    // Refs for tracking study session without causing re-renders
    const sessionIdRef = useRef<string | null>(null)
    const sessionStartRef = useRef<Date | null>(null)
    const wasRunningRef = useRef(false)
    const userRef = useRef(user)

    // Keep userRef in sync with user
    useEffect(() => {
        userRef.current = user
    }, [user])

    // Detect when timer stops → end the database study session
    useEffect(() => {
        const wasRunning = wasRunningRef.current
        wasRunningRef.current = timer.isRunning

        if (wasRunning && !timer.isRunning) {
            // Timer just stopped (completed naturally or was reset)
            if (sessionIdRef.current && userRef.current && sessionStartRef.current) {
                const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 1000)

                if (duration >= 60) {
                    // Only record sessions of at least 1 minute
                    endStudySession(sessionIdRef.current, duration, userRef.current.id)
                        .catch(err => console.error('Failed to end study session:', err))
                }

                sessionIdRef.current = null
                sessionStartRef.current = null
            }
        }
    }, [timer.isRunning])

    // Wrapped startTimer that also creates a database session
    const timerWithSession = useMemo(() => ({
        ...timer,
        startTimer: (hours: number, minutes: number): boolean => {
            const success = timer.startTimer(hours, minutes)
            if (success && userRef.current) {
                startStudySession(userRef.current.id)
                    .then(session => {
                        sessionIdRef.current = session.id
                        sessionStartRef.current = new Date()
                    })
                    .catch(err => console.error('Failed to start study session:', err))
            }
            return success
        }
    }), [timer])

    const value = useMemo<TimerContextType>(() => ({
        timer: timerWithSession,
        isMinimized,
        setIsMinimized,
        showTimerModal,
        setShowTimerModal
    }), [timerWithSession, isMinimized, showTimerModal])

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    )
}
