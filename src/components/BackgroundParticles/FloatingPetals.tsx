import './FloatingPetals.css'

interface FloatingPetalsProps {
  color: 'pink' | 'coral' | 'lavender' | 'mint' | 'coffee' | 'gray'
  count?: number
  opacity?: number
}

const colorMap = {
  pink: ['#ffb3d9', '#ffc2e0', '#ffd6eb'],
  coral: ['#ff9a76', '#ffb38a', '#ffc09f'],
  lavender: ['#d7bfff', '#e0ccff', '#ead9ff'],
  mint: ['#a8e6cf', '#8ee4af', '#74e08f'],
  coffee: ['#d4a574', '#c49565', '#b48556'],
  gray: ['#d4d4d4', '#c0c0c0', '#b0b0b0'],
}

/**
 * FloatingPetals component
 * Reusable floating particles for colorful themes
 */
export default function FloatingPetals({
  color,
  count = 20,
  opacity = 1,
}: FloatingPetalsProps) {
  const colors = colorMap[color]

  return (
    <div className="floating-petals">
      {Array.from({ length: count }).map((_, index) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        const size = 8 + Math.random() * 12
        const duration = 15 + Math.random() * 10
        const delay = Math.random() * 5

        return (
          <div
            key={index}
            className="petal"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 - Math.random() * 20}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: randomColor,
              opacity: opacity * (0.4 + Math.random() * 0.6),
              animationDuration: `${duration}s`,
              animationDelay: `-${delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}
