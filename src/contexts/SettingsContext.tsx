import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'

interface UserSettings {
  email_updates: boolean
  reminder_time: string
  auto_save_notes: boolean
  sound_effects: boolean
  language: string
  timezone: string
  note_font_size: string
}

interface SettingsContextType {
  settings: UserSettings
  loading: boolean
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>
}

const DEFAULT_SETTINGS: UserSettings = {
  email_updates: true,
  reminder_time: '09:00',
  auto_save_notes: true,
  sound_effects: true,
  language: 'en',
  timezone: 'UTC',
  note_font_size: 'medium'
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Load settings from database
  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      setSettings(DEFAULT_SETTINGS)
      setLoading(false)
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings({
          email_updates: data.email_updates ?? DEFAULT_SETTINGS.email_updates,
          reminder_time: data.reminder_time || DEFAULT_SETTINGS.reminder_time,
          auto_save_notes: data.auto_save_notes ?? DEFAULT_SETTINGS.auto_save_notes,
          sound_effects: data.sound_effects ?? DEFAULT_SETTINGS.sound_effects,
          language: data.language || DEFAULT_SETTINGS.language,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          note_font_size: data.note_font_size || DEFAULT_SETTINGS.note_font_size
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return

    try {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)

      // Update in database
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            ...updatedSettings,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error
    } catch (error) {
      console.error('Error updating settings:', error)
      // Revert changes on error
      loadSettings()
    }
  }

  const value = useMemo<SettingsContextType>(() => ({
    settings,
    loading,
    updateSettings
  }), [settings, loading])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
