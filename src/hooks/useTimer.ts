import { useState, useEffect, useRef } from 'react'

export interface TimerState {
    timeRemaining: number
    totalTime: number
    isPaused: boolean
    isRunning: boolean
}

export function useTimer() {
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [totalTime, setTotalTime] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Countdown logic
    useEffect(() => {
        if (isRunning && !isPaused && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        playAlarm()
                        setIsRunning(false)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, isPaused, timeRemaining])

    const playAlarm = () => {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        // Play alarm sound for 3 seconds
        const beepCount = 6
        const beepDuration = 0.2

        for (let i = 0; i < beepCount; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.value = 800 // Hz
                oscillator.type = 'sine'

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + beepDuration)

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + beepDuration)
            }, i * 500)
        }

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Timer Complete!', {
                body: 'Your study session is complete. Time for a break!',
                icon: '/favicon.ico'
            })
        }
    }

    const startTimer = (hours: number, minutes: number) => {
        const totalSeconds = hours * 3600 + minutes * 60
        if (totalSeconds === 0) {
            return false
        }

        setTimeRemaining(totalSeconds)
        setTotalTime(totalSeconds)
        setIsRunning(true)
        setIsPaused(false)

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        return true
    }

    const pauseTimer = () => {
        setIsPaused(!isPaused)
    }

    const resetTimer = () => {
        setIsRunning(false)
        setIsPaused(false)
        setTimeRemaining(0)
        setTotalTime(0)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
    }

    const getTimerState = (): TimerState => ({
        timeRemaining,
        totalTime,
        isPaused,
        isRunning
    })

    return {
        isRunning,
        isPaused,
        timeRemaining,
        totalTime,
        startTimer,
        pauseTimer,
        resetTimer,
        getTimerState
    }
}
