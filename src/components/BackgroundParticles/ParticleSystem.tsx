import { useTheme } from '../../hooks/useTheme'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useSeason } from '../../hooks/useSeason'
import CosmosParticles from './CosmosParticles'
import OceanWaves from './OceanWaves'
import FloatingPetals from './FloatingPetals'
import SeasonalEffects from './SeasonalEffects'

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
      return <FloatingPetals color="pink" count={20} />

    case 'coral-sunset':
      return <FloatingPetals color="coral" count={20} />

    case 'lavender-dream':
      return <FloatingPetals color="lavender" count={20} />

    case 'mint-fresh':
      return <FloatingPetals color="mint" count={20} />

    case 'midnight-latte':
      return <FloatingPetals color="coffee" count={15} />

    case 'pure-white':
      return <FloatingPetals color="gray" count={15} opacity={0.2} />

    case 'seasonal':
      return <SeasonalEffects season={currentSeason} />

    default:
      return null
  }
}
