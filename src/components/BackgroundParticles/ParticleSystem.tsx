import { useTheme } from '../../hooks/useTheme'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useSeason } from '../../hooks/useSeason'
import CosmosParticles from './CosmosParticles'
import OceanWaves from './OceanWaves'
import FloatingPetals from './FloatingPetals'
import SeasonalEffects from './SeasonalEffects'
import ForestLeaves from './ForestLeaves'
import FlowerPetals from './FlowerPetals'
import LavenderBlossoms from './LavenderBlossoms'
import SunsetGlow from './SunsetGlow'
import FloatingBubbles from './FloatingBubbles'

/**
 * ParticleSystem component
 * Renders theme-specific animated background particles
 */
export default function ParticleSystem() {
  const { currentTheme, particlesEnabled } = useTheme()
  const prefersReducedMotion = usePrefersReducedMotion()
  const currentSeason = useSeason()

  // Don't render particles if disabled or user prefers reduced motion
  if (!particlesEnabled || prefersReducedMotion) {
    return null
  }

  // Render theme-specific particle component
  switch (currentTheme) {
    case 'midnight-cosmos':
      return <CosmosParticles />

    case 'midnight-black':
      return <CosmosParticles color="white" opacity={0.3} />

    case 'ocean-breeze':
      return <OceanWaves />

    case 'soft-pastels':
      return <FlowerPetals />

    case 'coral-sunset':
      return <SunsetGlow />

    case 'lavender-dream':
      return <LavenderBlossoms />

    case 'mint-fresh':
      return <ForestLeaves />

    case 'midnight-latte':
      return <FloatingPetals color="coffee" count={15} />

    case 'pure-white':
      return <FloatingBubbles />

    case 'seasonal':
      return <SeasonalEffects season={currentSeason} />

    default:
      return null
  }
}
