import { useSettings } from '../contexts/SettingsContext'

// Sound effect types
export type SoundType = 'success' | 'error' | 'notification' | 'timerComplete' | 'click'

// Simple sound frequencies for different types
const soundConfig: Record<SoundType, { frequency: number; duration: number }> = {
  success: { frequency: 523.25, duration: 200 }, // C5
  error: { frequency: 349.23, duration: 300 }, // F4
  notification: { frequency: 659.25, duration: 150 }, // E5
  timerComplete: { frequency: 783.99, duration: 400 }, // G5
  click: { frequency: 440, duration: 50 } // A4
}

export function useSoundEffects() {
  const { settings } = useSettings()

  const playSound = (type: SoundType) => {
    // Only play if sound effects are enabled
    if (!settings.sound_effects) {
      return
    }

    try {
      const config = soundConfig[type]
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = config.frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + config.duration / 1000)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  return {
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
    playNotification: () => playSound('notification'),
    playTimerComplete: () => playSound('timerComplete'),
    playClick: () => playSound('click'),
    soundEnabled: settings.sound_effects
  }
}
