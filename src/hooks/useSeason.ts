import { useState, useEffect } from 'react'
import type { SeasonalVariant } from '../styles/themeDefinitions'

/**
 * Hook to detect the current season based on calendar date
 * Returns 'spring', 'summer', 'fall', or 'winter'
 *
 * Defaults to Northern Hemisphere seasons.
 * Can be enhanced to detect hemisphere based on timezone.
 */
export function useSeason(): SeasonalVariant {
  const [season, setSeason] = useState<SeasonalVariant>(() => getCurrentSeason())

  useEffect(() => {
    // Update season on component mount
    setSeason(getCurrentSeason())

    // Optional: Check for season changes (e.g., if user leaves tab open for months)
    const interval = setInterval(() => {
      setSeason(getCurrentSeason())
    }, 1000 * 60 * 60 * 24) // Check once per day

    return () => clearInterval(interval)
  }, [])

  return season
}

/**
 * Get the current season based on the month
 * Northern Hemisphere seasons by default
 */
function getCurrentSeason(): SeasonalVariant {
  const month = new Date().getMonth() // 0-11

  // Determine hemisphere based on timezone (optional enhancement)
  const isNorthernHemisphere = detectHemisphere() === 'northern'

  if (isNorthernHemisphere) {
    // Northern Hemisphere
    if (month >= 2 && month <= 4) return 'spring'  // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'summer'  // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'fall'   // Sep, Oct, Nov
    return 'winter'                                 // Dec, Jan, Feb
  } else {
    // Southern Hemisphere (opposite seasons)
    if (month >= 2 && month <= 4) return 'fall'    // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'winter'  // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'spring' // Sep, Oct, Nov
    return 'summer'                                 // Dec, Jan, Feb
  }
}

/**
 * Detect hemisphere based on timezone
 * Returns 'northern' or 'southern'
 */
function detectHemisphere(): 'northern' | 'southern' {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Common Southern Hemisphere timezones
    const southernTimezones = [
      'Australia/',
      'Pacific/Auckland',
      'Pacific/Fiji',
      'America/Argentina',
      'America/Santiago',
      'America/Lima', // Peru
      'America/Bogota', // Colombia (mostly northern but near equator)
      'Africa/Johannesburg',
      'Africa/Harare',
      'Indian/Mauritius',
    ]

    const isSouthern = southernTimezones.some((tz) => timezone.includes(tz))
    return isSouthern ? 'southern' : 'northern'
  } catch (error) {
    // Fallback to northern hemisphere if detection fails
    console.warn('Failed to detect hemisphere, defaulting to northern:', error)
    return 'northern'
  }
}
