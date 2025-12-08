import { createContext, useContext, useState, ReactNode } from 'react'
import { useTimer } from '../hooks/useTimer'

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
        </TimerContext.Provider>
    )
}

