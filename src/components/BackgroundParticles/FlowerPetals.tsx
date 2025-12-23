import './FlowerPetals.css'

/**
 * FlowerPetals component for Soft Pastels theme
 * Delicate flower petals with soft, dreamy animation
 */
export default function FlowerPetals() {
  const petalCount = 18

  const petalColors = [
    '#dba1a2',
    '#f4c2c2',
    '#ffb3d9',
    '#ffc2e0',
    '#f5d5e0',
  ]

  return (
    <div className="flower-petals">
      {Array.from({ length: petalCount }).map((_, index) => {
        const size = 12 + Math.random() * 20
        const duration = 18 + Math.random() * 12
        const delay = Math.random() * 6
        const drift = -40 + Math.random() * 80
        const color = petalColors[Math.floor(Math.random() * petalColors.length)]

        return (
          <div
            key={index}
            className="petal-flower"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 - Math.random() * 20}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `-${delay}s`,
              '--drift': `${drift}px`,
              '--petal-color': color,
            } as React.CSSProperties}
          >
            {/* Petal SVG shape */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="petal-svg">
              <path d="M12,2C12,2 7,4 7,12C7,15.31 9.69,18 13,18C13.34,18 13.67,17.97 14,17.92C14.03,17.67 14.04,17.34 14.04,17C14.04,13.69 16.73,11 20.04,11C20.38,11 20.72,11.03 21.06,11.09C21.56,7.5 18.5,2 12,2M12,22C12,22 17,20 17,12C17,8.69 14.31,6 11,6C10.66,6 10.33,6.03 10,6.08C9.97,6.33 9.96,6.66 9.96,7C9.96,10.31 7.27,13 3.96,13C3.62,13 3.28,12.97 2.94,12.91C2.44,16.5 5.5,22 12,22Z" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}
