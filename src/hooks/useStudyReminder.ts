import { useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabase'

interface ReminderSettings {
  enabled: boolean
  time: string
  soundEnabled: boolean
  timezone: string
}

export const useStudyReminder = (userId: string | undefined) => {
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: false,
    time: '09:00',
    soundEnabled: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastNotificationRef = useRef<string>('')

  // Load reminder settings from database
  useEffect(() => {
    if (!userId) return

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('study_reminders, reminder_time, sound_effects, timezone')
          .eq('user_id', userId)
          .single()

        if (error) {
          console.error('❌ Error loading reminder settings:', error)
          return
        }

        if (data) {
          const newSettings = {
            enabled: data.study_reminders,
            time: data.reminder_time,
            soundEnabled: data.sound_effects,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          }
          console.log('✅ Study reminder settings loaded:', newSettings)
          setSettings(newSettings)
        }
      } catch (error) {
        console.error('❌ Error loading reminder settings:', error)
      }
    }

    loadSettings()

    // Also listen for changes to settings
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('⚡ Settings updated, reloading reminders...')
          loadSettings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Request notification permission
  useEffect(() => {
    if (settings.enabled && 'Notification' in window) {
      console.log('🔔 Current notification permission:', Notification.permission)
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...')
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission result:', permission)
        })
      } else if (Notification.permission === 'denied') {
        console.warn('⚠️ Notifications are BLOCKED! Please enable them in browser settings.')
        alert('Notifications are blocked! Please enable notifications for this site in your browser settings to receive study reminders.')
      } else if (Notification.permission === 'granted') {
        console.log('✅ Notifications are ALLOWED')
      }
    }
  }, [settings.enabled])

  // Play notification sound
  const playNotificationSound = () => {
    if (!settings.soundEnabled) return

    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }

  // Show browser notification
  const showNotification = () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification('LUCERO Study Reminder', {
        body: "It's time to study! Keep your streak going 🔥",
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'study-reminder',
        requireInteraction: false,
        silent: !settings.soundEnabled
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Play sound
      if (settings.soundEnabled) {
        playNotificationSound()
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          showNotification()
        }
      })
    }
  }

  // Check if it's time to send reminder
  const checkReminderTime = () => {
    if (!settings.enabled) {
      console.log('⏭️ Reminders disabled, skipping check')
      return
    }

    const now = new Date()
    const [hours, minutes] = settings.time.split(':').map(Number)

    // Get current time in user's timezone
    const currentHours = now.getHours()
    const currentMinutes = now.getMinutes()

    // Create a unique key for today's reminder
    const today = now.toDateString()
    const notificationKey = `${today}-${hours}:${minutes}`

    // Log current time vs reminder time
    const currentTime = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`
    const reminderTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    console.log(`⏰ Time check - Current: ${currentTime}, Reminder set for: ${reminderTime}`)

    // Check if it's the reminder time (within 1 minute window)
    if (
      currentHours === hours &&
      currentMinutes === minutes &&
      lastNotificationRef.current !== notificationKey
    ) {
      console.log('🔔 ✅ TIME MATCH! Triggering study reminder!')
      showNotification()
      lastNotificationRef.current = notificationKey
    } else if (currentHours === hours && currentMinutes === minutes) {
      console.log('⏭️ Already sent notification for this time today')
    }
  }

  // Set up interval to check time every minute
  useEffect(() => {
    if (settings.enabled) {
      console.log('⏰ Starting reminder checker - will check every minute')
      // Check immediately
      checkReminderTime()

      // Then check every minute
      checkIntervalRef.current = setInterval(checkReminderTime, 60000) // 60 seconds

      return () => {
        if (checkIntervalRef.current) {
          console.log('⏰ Stopping reminder checker')
          clearInterval(checkIntervalRef.current)
        }
      }
    } else {
      if (checkIntervalRef.current) {
        console.log('⏰ Reminders disabled, stopping checker')
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [settings])

  return {
    settings,
    testNotification: showNotification
  }
}
