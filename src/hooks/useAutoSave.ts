import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'

interface UseAutoSaveOptions {
  onSave: () => Promise<void>
  delay?: number
}

export function useAutoSave({ onSave, delay = 2000 }: UseAutoSaveOptions) {
  const { settings } = useSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const triggerAutoSave = () => {
    // Only auto-save if the setting is enabled
    if (!settings.auto_save_notes) {
      return
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout to save after delay
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await onSave()
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, delay)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    triggerAutoSave,
    isSaving,
    lastSaved,
    autoSaveEnabled: settings.auto_save_notes
  }
}
