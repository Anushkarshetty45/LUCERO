import { useTheme } from '../hooks/useTheme'
import { type ThemeName } from '../styles/themeDefinitions'
import ThemePreviewCard from './ThemePreviewCard'
import './ThemeModal.css'

interface ThemeModalProps {
  onClose: () => void
}

/**
 * ThemeModal component
 * Pinterest-style grid modal for theme selection
 */
export default function ThemeModal({ onClose }: ThemeModalProps) {
  const { currentTheme, setTheme, particlesEnabled, setParticlesEnabled } = useTheme()

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
    // Don't close modal - let user preview multiple themes
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay theme-modal-overlay" onClick={handleOverlayClick}>
      <div className="theme-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header theme-modal-header">
          <h2>🎨 Choose Your Theme</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Animation Toggle */}
        <div className="theme-animation-toggle">
          <div className="toggle-info">
            <h3>Background Animations</h3>
            <p>Show floating particles and visual effects</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={particlesEnabled}
              onChange={(e) => setParticlesEnabled(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Theme Grid */}
        <div className="theme-grid">
          {allThemes.map((theme, index) => (
            <ThemePreviewCard
              key={theme}
              theme={theme}
              isActive={currentTheme === theme}
              onClick={() => handleThemeSelect(theme)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="theme-modal-footer">
          <p className="theme-tip">
            💡 Tip: Your theme syncs across all your devices automatically!
          </p>
          <button className="btn-primary btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
