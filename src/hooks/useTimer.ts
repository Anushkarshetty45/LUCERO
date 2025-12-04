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

        // iPhone-style ringtone pattern (6 seconds, louder)
        // Plays a pleasant melody similar to iPhone's "Opening" ringtone
        const melody = [
            { freq: 1046.50, start: 0, duration: 0.15 },      // C6
            { freq: 1318.51, start: 0.15, duration: 0.15 },   // E6
            { freq: 1567.98, start: 0.3, duration: 0.15 },    // G6
            { freq: 2093.00, start: 0.45, duration: 0.3 },    // C7

            { freq: 1567.98, start: 0.9, duration: 0.15 },    // G6
            { freq: 2093.00, start: 1.05, duration: 0.3 },    // C7

            { freq: 1046.50, start: 1.5, duration: 0.15 },    // C6
            { freq: 1318.51, start: 1.65, duration: 0.15 },   // E6
            { freq: 1567.98, start: 1.8, duration: 0.15 },    // G6
            { freq: 2093.00, start: 1.95, duration: 0.3 },    // C7

            { freq: 1567.98, start: 2.4, duration: 0.15 },    // G6
            { freq: 2093.00, start: 2.55, duration: 0.3 },    // C7

            // Repeat pattern
            { freq: 1046.50, start: 3, duration: 0.15 },      // C6
            { freq: 1318.51, start: 3.15, duration: 0.15 },   // E6
            { freq: 1567.98, start: 3.3, duration: 0.15 },    // G6
            { freq: 2093.00, start: 3.45, duration: 0.3 },    // C7

            { freq: 1567.98, start: 3.9, duration: 0.15 },    // G6
            { freq: 2093.00, start: 4.05, duration: 0.3 },    // C7

            { freq: 1046.50, start: 4.5, duration: 0.15 },    // C6
            { freq: 1318.51, start: 4.65, duration: 0.15 },   // E6
            { freq: 1567.98, start: 4.8, duration: 0.15 },    // G6
            { freq: 2093.00, start: 4.95, duration: 0.5 },    // C7 (longer final note)
        ]

        // Play each note in the melody
        melody.forEach(note => {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.value = note.freq
            oscillator.type = 'sine'

            // Louder volume (0.6 instead of 0.3)
            const startTime = audioContext.currentTime + note.start
            gainNode.gain.setValueAtTime(0, startTime)
            gainNode.gain.linearRampToValueAtTime(0.6, startTime + 0.01)
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration)

            oscillator.start(startTime)
            oscillator.stop(startTime + note.duration)
        })

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
