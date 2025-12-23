import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { type ThemeName, themeMetadata } from '../styles/themeDefinitions'
import './QuickThemeSwitcher.css'

/**
 * QuickThemeSwitcher component
 * Compact theme dropdown for Dashboard header
 */
export default function QuickThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const allThemes: ThemeName[] = [
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

  const handleThemeSelect = (theme: ThemeName) => {
    setTheme(theme)
    setIsOpen(false)
  }

  return (
    <div className="quick-theme-switcher">
      <button
        className="theme-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <span className="theme-icon">🎨</span>
        <span className="theme-label">{themeMetadata[currentTheme].emoji}</span>
      </button>

      {isOpen && (
        <>
          <div className="theme-dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="theme-dropdown">
            <div className="theme-dropdown-header">
              <span>Choose Theme</span>
            </div>
            <div className="theme-list">
              {allThemes.map((theme) => (
                <button
                  key={theme}
                  className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <span className="theme-option-emoji">{themeMetadata[theme].emoji}</span>
                  <span className="theme-option-name">{themeMetadata[theme].name}</span>
                  {currentTheme === theme && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
