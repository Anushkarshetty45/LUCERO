import './FloatingTimer.css'

interface FloatingTimerProps {
    timeRemaining: number
    totalTime: number
    isPaused: boolean
    onClick: () => void
}

export default function FloatingTimer({ timeRemaining, totalTime, isPaused, onClick }: FloatingTimerProps) {
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

    return (
        <div className={`floating-timer ${isPaused ? 'paused' : ''}`} onClick={onClick}>
            <div className="floating-timer-content">
                <div className="floating-timer-icon">⏱️</div>
                <div className="floating-timer-info">
                    <div className="floating-timer-time">{formatTime(timeRemaining)}</div>
                    <div className="floating-timer-status">{isPaused ? 'Paused' : 'Running'}</div>
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
