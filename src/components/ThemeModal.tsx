import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'
import { useSubscription } from '../hooks/useSubscription'
import { type ThemeName } from '../styles/themeDefinitions'
import ThemePreviewCard from './ThemePreviewCard'
import UpgradeModal from './UpgradeModal'
import './ThemeModal.css'

interface ThemeModalProps {
  onClose: () => void
}

const FREE_THEMES: ThemeName[] = ['midnight-cosmos', 'pure-white']

export default function ThemeModal({ onClose }: ThemeModalProps) {
  const { t } = useTranslation()
  const { currentTheme, setTheme, particlesEnabled, setParticlesEnabled } = useTheme()
  const { limits } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

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
    const isPremium = !FREE_THEMES.includes(theme)
    if (isPremium && !limits.isPro) {
      setShowUpgrade(true)
      return
    }
    setTheme(theme)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div className="modal-overlay theme-modal-overlay" onClick={handleOverlayClick}>
        <div className="theme-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header theme-modal-header">
            <h2>{t('theme.title')}</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="theme-animation-toggle">
            <div className="toggle-info">
              <h3>{t('theme.backgroundAnimations')}</h3>
              <p>{t('theme.animationsDescription')}</p>
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

          {!limits.isPro && (
            <p className="theme-pro-notice">
              Pro themes locked — <button className="theme-pro-link" onClick={() => setShowUpgrade(true)}>Upgrade to Pro</button> to unlock all themes
            </p>
          )}

          <div className="theme-grid">
            {allThemes.map((theme) => {
              const isPremium = !FREE_THEMES.includes(theme)
              const locked = isPremium && !limits.isPro
              return (
                <div key={theme} className={`theme-card-wrapper ${locked ? 'theme-locked' : ''}`}>
                  <ThemePreviewCard
                    theme={theme}
                    isActive={currentTheme === theme}
                    onClick={() => handleThemeSelect(theme)}
                  />
                  {locked && <span className="theme-lock-badge">Pro</span>}
                </div>
              )
            })}
          </div>

          <div className="theme-modal-footer">
            <p className="theme-tip">{t('theme.tip')}</p>
            <button className="btn-primary btn-done" onClick={onClose}>
              {t('theme.done')}
            </button>
          </div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => setShowUpgrade(false)}
        />
      )}
    </>
  )
}
