import { createContext, useContext, useState, ReactNode } from 'react'
import { useTimer } from '../hooks/useTimer'
import FloatingTimer from '../components/FloatingTimer'

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
    const [isMinimized, setIsMinimized] = useState(false)
    const [showTimerModal, setShowTimerModal] = useState(false)

    const handleFloatingTimerClick = () => {
        setIsMinimized(false)
        setShowTimerModal(true)
    }

    return (
        <TimerContext.Provider
            value={{
                timer,
                isMinimized,
                setIsMinimized,
                showTimerModal,
                setShowTimerModal
            }}
        >
            {children}
            {isMinimized && timer.isRunning && (
                <FloatingTimer
                    timeRemaining={timer.timeRemaining}
                    totalTime={timer.totalTime}
                    isPaused={timer.isPaused}
                    onClick={handleFloatingTimerClick}
                />
            )}
        </TimerContext.Provider>
    )
}
