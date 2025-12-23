import './SunsetGlow.css'

/**
 * SunsetGlow component for Coral Sunset theme
 * Warm, glowing orbs that evoke sunset colors
 */
export default function SunsetGlow() {
  const orbCount = 12

  const sunsetColors = [
    { color: '#ff6f3c', glow: 'rgba(255, 111, 60, 0.4)' },
    { color: '#ff8c69', glow: 'rgba(255, 140, 105, 0.4)' },
    { color: '#ffa894', glow: 'rgba(255, 168, 148, 0.4)' },
    { color: '#f4978e', glow: 'rgba(244, 151, 142, 0.4)' },
    { color: '#f8ad9d', glow: 'rgba(248, 173, 157, 0.4)' },
  ]

  return (
    <div className="sunset-glow">
      {Array.from({ length: orbCount }).map((_, index) => {
        const size = 20 + Math.random() * 40
        const duration = 25 + Math.random() * 15
        const delay = Math.random() * 8
        const drift = -60 + Math.random() * 120
        const colorObj = sunsetColors[Math.floor(Math.random() * sunsetColors.length)]

        return (
          <div
            key={index}
            className="sunset-orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 - Math.random() * 20}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: `radial-gradient(circle, ${colorObj.color}, transparent)`,
              boxShadow: `0 0 ${size * 1.5}px ${colorObj.glow}`,
              animationDuration: `${duration}s`,
              animationDelay: `-${delay}s`,
              '--drift': `${drift}px`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
