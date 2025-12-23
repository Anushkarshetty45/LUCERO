import { type SeasonalVariant } from '../../styles/themeDefinitions'
import FloatingPetals from './FloatingPetals'
import './SeasonalEffects.css'

interface SeasonalEffectsProps {
  season: SeasonalVariant
}

/**
 * SeasonalEffects component
 * Dynamic particles based on current season
 */
export default function SeasonalEffects({ season }: SeasonalEffectsProps) {
  switch (season) {
    case 'spring':
      // Cherry blossom petals
      return (
        <div className="seasonal-effects spring">
          <FloatingPetals color="pink" count={25} />
        </div>
      )

    case 'summer':
      // Sun rays / fireflies
      return (
        <div className="seasonal-effects summer">
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={index}
              className="firefly"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )

    case 'fall':
      // Falling leaves
      return (
        <div className="seasonal-effects fall">
          {Array.from({ length: 25 }).map((_, index) => {
            const colors = ['#d2691e', '#cd853f', '#daa520', '#b8860b', '#ff8c00']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            return (
              <div
                key={index}
                className="leaf"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${-20 - Math.random() * 20}%`,
                  background: randomColor,
                  animationDelay: `-${Math.random() * 10}s`,
                  animationDuration: `${10 + Math.random() * 5}s`,
                }}
              />
            )
          })}
        </div>
      )

    case 'winter':
      // Snowflakes
      return (
        <div className="seasonal-effects winter">
          {Array.from({ length: 30 }).map((_, index) => (
            <div
              key={index}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${-20 - Math.random() * 20}%`,
                fontSize: `${10 + Math.random() * 10}px`,
                animationDelay: `-${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}
