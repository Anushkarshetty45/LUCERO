import { useTimerContext } from '../contexts/TimerContext'
import './FloatingTimer.css'

export default function FloatingTimer() {
    const { timer, isMinimized, setIsMinimized, setShowTimerModal } = useTimerContext()

    // Only show if timer is running and minimized
    if (!timer.isRunning || !isMinimized) return null

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const progress = timer.totalTime > 0 ? ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100 : 0

    const handleClick = () => {
        setIsMinimized(false)
        setShowTimerModal(true)
    }

    return (
        <div className={`floating-timer ${timer.isPaused ? 'paused' : ''}`} onClick={handleClick}>
            <div className="floating-timer-content">
                <div className="floating-timer-icon">⏱️</div>
                <div className="floating-timer-info">
                    <div className="floating-timer-time">{formatTime(timer.timeRemaining)}</div>
                    <div className="floating-timer-status">{timer.isPaused ? 'Paused' : 'Running'}</div>
                </div>
            </div>
            <div className="floating-timer-progress">
                <div
                    className="floating-timer-progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    )
}
