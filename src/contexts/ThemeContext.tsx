import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSeason } from '../hooks/useSeason'
import { supabase } from '../services/supabase'
import {
  type ThemeName,
  type ThemePalette,
  themeDefinitions,
  getThemePalette,
} from '../styles/themeDefinitions'

// Context type definition
interface ThemeContextType {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  particlesEnabled: boolean
  setParticlesEnabled: (enabled: boolean) => void
  isLoading: boolean
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Provider props
interface ThemeProviderProps {
  children: ReactNode
}

/**
 * ThemeProvider component
 * Manages theme state, database sync, and CSS variable updates
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth()
  const currentSeason = useSeason()

  const [currentTheme, setCurrentTheme] = useState<ThemeName>('midnight-cosmos')
  const [particlesEnabled, setParticlesEnabledState] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Apply theme to CSS variables
  const applyTheme = (themeName: ThemeName) => {
    const palette = getThemePalette(themeName, currentSeason)
    const root = document.documentElement

    // Update all CSS custom properties
    root.style.setProperty('--bg-primary', palette.bgPrimary)
    root.style.setProperty('--bg-secondary', palette.bgSecondary)
    root.style.setProperty('--bg-card', palette.bgCard)
    root.style.setProperty('--bg-card-hover', palette.bgCardHover)

    root.style.setProperty('--text-primary', palette.textPrimary)
    root.style.setProperty('--text-secondary', palette.textSecondary)
    root.style.setProperty('--text-tertiary', palette.textTertiary)

    root.style.setProperty('--accent-primary', palette.accentPrimary)
    root.style.setProperty('--accent-secondary', palette.accentSecondary)

    root.style.setProperty('--border-color', palette.borderColor)
    root.style.setProperty('--border-glow', palette.borderGlow)

    root.style.setProperty('--shadow-soft', palette.shadowSoft)
    root.style.setProperty('--shadow-medium', palette.shadowMedium)
    root.style.setProperty('--shadow-hover', palette.shadowHover)
    root.style.setProperty('--shadow-glow', palette.shadowGlow)

    root.style.setProperty('--color-success', palette.success)
    root.style.setProperty('--color-error', palette.error)
    root.style.setProperty('--color-warning', palette.warning)
    root.style.setProperty('--color-info', palette.info)
  }

  // Load theme from database or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setIsLoading(true)

        // If user is NOT logged in, always use midnight-cosmos (for Home, Auth pages)
        if (!user) {
          setCurrentTheme('midnight-cosmos')
          applyTheme('midnight-cosmos')
          setIsLoading(false)
          return
        }

        // User is authenticated - load their preferred theme
        const localTheme = localStorage.getItem('lucero-theme') as ThemeName | null
        const localParticles = localStorage.getItem('lucero-particles')

        if (localTheme && isValidTheme(localTheme)) {
          setCurrentTheme(localTheme)
          applyTheme(localTheme)
        }

        if (localParticles !== null) {
          setParticlesEnabledState(localParticles === 'true')
        }

        // Load from database
        const { data, error } = await supabase
          .from('user_settings')
          .select('theme, particles_enabled')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = not found, which is ok (first time user)
          console.error('Error loading theme from database:', error)
        }

        if (data) {
          const dbTheme = data.theme as ThemeName
          const dbParticles = data.particles_enabled ?? true

          // Database takes precedence over localStorage
          if (dbTheme && isValidTheme(dbTheme)) {
            setCurrentTheme(dbTheme)
            applyTheme(dbTheme)
            localStorage.setItem('lucero-theme', dbTheme)
          }

          setParticlesEnabledState(dbParticles)
          localStorage.setItem('lucero-particles', String(dbParticles))
        } else {
          // No database record - create one with current settings
          await supabase.from('user_settings').upsert(
            {
              user_id: user.id,
              theme: localTheme || 'midnight-cosmos',
              particles_enabled: localParticles === 'true',
            },
            { onConflict: 'user_id' }
          )
        }
      } catch (error) {
        console.error('Error loading theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [user, currentSeason])

  // Re-apply theme when season changes (for seasonal theme)
  useEffect(() => {
    if (currentTheme === 'seasonal') {
      applyTheme('seasonal')
    }
  }, [currentSeason, currentTheme])

  // Set theme function with database sync
  const setTheme = async (themeName: ThemeName) => {
    if (!isValidTheme(themeName)) {
      console.error(`Invalid theme: ${themeName}`)
      return
    }

    // Prevent theme changes if user is not logged in
    if (!user) {
      console.warn('Theme changes are only available for logged-in users')
      return
    }

    try {
      // Update state
      setCurrentTheme(themeName)

      // Apply theme immediately
      applyTheme(themeName)

      // Save to localStorage for instant load next time
      localStorage.setItem('lucero-theme', themeName)

      // Sync to database
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            theme: themeName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.error('Error saving theme to database:', error)
      }
    } catch (error) {
      console.error('Error setting theme:', error)
    }
  }

  // Set particles enabled with database sync
  const setParticlesEnabled = async (enabled: boolean) => {
    // Prevent particle changes if user is not logged in
    if (!user) {
      console.warn('Particle settings are only available for logged-in users')
      return
    }

    try {
      // Update state
      setParticlesEnabledState(enabled)

      // Save to localStorage
      localStorage.setItem('lucero-particles', String(enabled))

      // Sync to database
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            particles_enabled: enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.error('Error saving particles preference to database:', error)
      }
    } catch (error) {
      console.error('Error setting particles:', error)
    }
  }

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    particlesEnabled,
    setParticlesEnabled,
    isLoading,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to use theme context
 * Must be used within ThemeProvider
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return context
}

/**
 * Validate if a theme name is valid
 */
function isValidTheme(theme: string): theme is ThemeName {
  const validThemes: ThemeName[] = [
    'midnight-cosmos',
    'pure-white',
    'midnight-black',
    'soft-pastels',
    'coral-sunset',
    'lavender-dream',
    'mint-fresh',
    'ocean-breeze',
    'midnight-latte',
    'seasonal',
  ]
  return validThemes.includes(theme as ThemeName)
}
