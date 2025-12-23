import './LavenderBlossoms.css'

/**
 * LavenderBlossoms component for Lavender Dream theme
 * Dreamy lavender flowers floating gracefully
 */
export default function LavenderBlossoms() {
  const blossomCount = 16

  const lavenderShades = [
    '#9c27b0',
    '#ab47bc',
    '#ba68c8',
    '#ce93d8',
    '#e1bee7',
  ]

  return (
    <div className="lavender-blossoms">
      {Array.from({ length: blossomCount }).map((_, index) => {
        const size = 16 + Math.random() * 24
        const duration = 22 + Math.random() * 14
        const delay = Math.random() * 7
        const drift = -50 + Math.random() * 100
        const color = lavenderShades[Math.floor(Math.random() * lavenderShades.length)]

        return (
          <div
            key={index}
            className="lavender-blossom"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 - Math.random() * 20}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `-${delay}s`,
              '--drift': `${drift}px`,
              '--blossom-color': color,
            } as React.CSSProperties}
          >
            {/* Lavender flower SVG */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="blossom-svg">
              <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M12,8A2,2 0 0,1 14,10A2,2 0 0,1 12,12A2,2 0 0,1 10,10A2,2 0 0,1 12,8M12,14A2,2 0 0,1 14,16A2,2 0 0,1 12,18A2,2 0 0,1 10,16A2,2 0 0,1 12,14M8,6A2,2 0 0,1 10,8A2,2 0 0,1 8,10A2,2 0 0,1 6,8A2,2 0 0,1 8,6M8,12A2,2 0 0,1 10,14A2,2 0 0,1 8,16A2,2 0 0,1 6,14A2,2 0 0,1 8,12M16,6A2,2 0 0,1 18,8A2,2 0 0,1 16,10A2,2 0 0,1 14,8A2,2 0 0,1 16,6M16,12A2,2 0 0,1 18,14A2,2 0 0,1 16,16A2,2 0 0,1 14,14A2,2 0 0,1 16,12M12,20V22H11V20H12Z" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}
