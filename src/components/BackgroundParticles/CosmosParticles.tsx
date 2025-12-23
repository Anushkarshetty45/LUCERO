import './CosmosParticles.css'

interface CosmosParticlesProps {
  color?: string
  opacity?: number
  count?: number
}

/**
 * CosmosParticles component
 * Renders animated starfield for dark space themes
 */
export default function CosmosParticles({
  color = 'white',
  opacity = 0.8,
  count = 30,
}: CosmosParticlesProps) {
  return (
    <div className="cosmos-particles">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 3}s`,
            opacity: opacity * (0.4 + Math.random() * 0.6),
            backgroundColor: color,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }}
        />
      ))}
    </div>
  )
}
