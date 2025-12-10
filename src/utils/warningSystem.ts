import { WarningLevel } from '../types/liveStudy'

let audioContext: AudioContext | null = null

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume()
    }
    return audioContext
}

export function playWarningSound(level: WarningLevel, volume: number = 0.5): void {
    if (level === 'none' || level === 'visual') return

    const ctx = getAudioContext()

    const frequencies: Record<Exclude<WarningLevel, 'none' | 'visual'>, number> = {
        soft: 400,
        loud: 800
    }

    const durations: Record<Exclude<WarningLevel, 'none' | 'visual'>, number> = {
        soft: 0.3,
        loud: 0.5
    }

    const freq = frequencies[level as keyof typeof frequencies]
    const duration = durations[level as keyof typeof durations]

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = freq
    oscillator.type = 'sine'

    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
}

// Soft tab switch warning (first 5 seconds)
export function playTabSwitchWarning(volume: number = 0.5): void {
    const ctx = getAudioContext()

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 600
    oscillator.type = 'sine'

    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    oscillator.start(now)
    oscillator.stop(now + 0.3)
}

// LOUD escalating alarm (after 5 seconds of distraction)
export function playLoudAlarm(): void {
    const ctx = getAudioContext()
    const volume = 0.9

    // Play three rapid beeps for urgency
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.frequency.value = 1200 // Higher pitch = more alarming
            oscillator.type = 'square' // Harsher sound

            const now = ctx.currentTime
            gainNode.gain.setValueAtTime(0, now)
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

            oscillator.start(now)
            oscillator.stop(now + 0.15)
        }, i * 200)
    }
}

export function getWarningLevel(distractionCount: number): WarningLevel {
    if (distractionCount === 0) return 'none'
    if (distractionCount === 1) return 'visual'
    if (distractionCount === 2) return 'soft'
    return 'loud'
}

export function getWarningMessage(type: 'tab_switch' | 'face_away' | 'looking_down'): string {
    const messages = {
        tab_switch: '⚠️ Stay focused! Return to your study tab',
        face_away: '👀 Keep your eyes on the material',
        looking_down: '📱 Put your phone down and focus!'
    }
    return messages[type]
}
