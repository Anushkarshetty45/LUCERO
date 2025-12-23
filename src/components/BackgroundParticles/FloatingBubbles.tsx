import './FloatingBubbles.css'

/**
 * FloatingBubbles component for Pure White theme
 * Subtle, minimal floating bubbles in soft gray tones
 */
export default function FloatingBubbles() {
  const bubbleCount = 20

  return (
    <div className="floating-bubbles">
      {Array.from({ length: bubbleCount }).map((_, index) => {
        const size = 8 + Math.random() * 20
        const duration = 20 + Math.random() * 15
        const delay = Math.random() * 8
        const drift = -40 + Math.random() * 80
        const opacity = 0.15 + Math.random() * 0.25

        return (
          <div
            key={index}
            className="bubble"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 - Math.random() * 20}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${duration}s`,
              animationDelay: `-${delay}s`,
              '--drift': `${drift}px`,
              opacity: opacity,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
