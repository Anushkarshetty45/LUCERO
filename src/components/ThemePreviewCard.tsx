import { type ThemeName, themeMetadata, getThemePalette } from '../styles/themeDefinitions'
import { useSeason } from '../hooks/useSeason'

interface ThemePreviewCardProps {
  theme: ThemeName
  isActive: boolean
  onClick: () => void
}

/**
 * ThemePreviewCard component
 * Shows a preview card for a single theme with live colors
 */
export default function ThemePreviewCard({ theme, isActive, onClick }: ThemePreviewCardProps) {
  const currentSeason = useSeason()
  const metadata = themeMetadata[theme]
  const palette = getThemePalette(theme, currentSeason)

  return (
    <div
      className={`theme-preview-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{
        background: palette.bgPrimary,
        borderColor: isActive ? palette.accentPrimary : palette.borderColor,
        boxShadow: isActive ? palette.shadowHover : palette.shadowSoft,
      }}
    >
      {/* Live preview area with theme colors */}
      <div
        className="theme-preview-display"
        style={{
          background: `linear-gradient(135deg, ${palette.bgSecondary} 0%, ${palette.bgPrimary} 100%)`,
        }}
      >
        {/* Sample card in theme colors */}
        <div
          className="preview-sample-card"
          style={{
            background: palette.bgCard,
            borderColor: palette.borderColor,
            color: palette.textPrimary,
          }}
        >
          <div
            className="preview-sample-text"
            style={{ color: palette.textPrimary }}
          >
            Aa
          </div>
          <div
            className="preview-sample-accent"
            style={{ background: palette.accentPrimary }}
          />
        </div>

        {/* Color swatches */}
        <div className="theme-color-swatches">
          <div
            className="color-swatch"
            style={{ background: palette.accentPrimary }}
            title="Primary Accent"
          />
          <div
            className="color-swatch"
            style={{ background: palette.accentSecondary }}
            title="Secondary Accent"
          />
          <div
            className="color-swatch"
            style={{ background: palette.textPrimary }}
            title="Text Color"
          />
        </div>
      </div>

      {/* Theme info */}
      <div
        className="theme-info"
        style={{
          background: palette.bgCard,
          borderTopColor: palette.borderColor,
          color: palette.textPrimary,
        }}
      >
        <div className="theme-name">
          <span className="theme-emoji">{metadata.emoji}</span>
          <span style={{ color: palette.textPrimary }}>{metadata.name}</span>
        </div>
        <div
          className="theme-description"
          style={{ color: palette.textSecondary }}
        >
          {metadata.description}
        </div>
        {isActive && (
          <div
            className="theme-active-badge"
            style={{
              background: palette.accentPrimary,
              color: palette.bgPrimary,
            }}
          >
            ✓ Active
          </div>
        )}
      </div>
    </div>
  )
}
