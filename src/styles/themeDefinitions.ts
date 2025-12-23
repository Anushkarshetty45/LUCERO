// Theme type definitions
export type ThemeName =
  | 'midnight-cosmos'
  | 'pure-white'
  | 'midnight-black'
  | 'soft-pastels'
  | 'coral-sunset'
  | 'lavender-dream'
  | 'mint-fresh'
  | 'ocean-breeze'
  | 'midnight-latte'
  | 'seasonal'

export type SeasonalVariant = 'spring' | 'summer' | 'fall' | 'winter'

export interface ThemePalette {
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgCard: string
  bgCardHover: string

  // Text colors
  textPrimary: string
  textSecondary: string
  textTertiary: string

  // Accent colors
  accentPrimary: string
  accentSecondary: string

  // Border colors
  borderColor: string
  borderGlow: string

  // Shadow effects
  shadowSoft: string
  shadowMedium: string
  shadowHover: string
  shadowGlow: string

  // Semantic colors
  success: string
  error: string
  warning: string
  info: string
}

// Complete theme definitions for all 10 themes
export const themeDefinitions: Record<ThemeName | `seasonal-${SeasonalVariant}`, ThemePalette> = {
  // 1. Midnight Cosmos (Current Default) ⭐
  'midnight-cosmos': {
    bgPrimary: '#030510',
    bgSecondary: '#010205',
    bgCard: 'rgba(10, 15, 30, 0.7)',
    bgCardHover: 'rgba(15, 20, 40, 0.85)',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    accentPrimary: '#a78bfa',
    accentSecondary: '#60a5fa',
    borderColor: 'rgba(148, 163, 184, 0.1)',
    borderGlow: 'rgba(167, 139, 250, 0.2)',
    shadowSoft: '0 2px 12px rgba(0, 0, 0, 0.3)',
    shadowMedium: '0 8px 24px rgba(0, 0, 0, 0.4)',
    shadowHover: '0 12px 32px rgba(167, 139, 250, 0.3)',
    shadowGlow: '0 0 30px rgba(167, 139, 250, 0.15)',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#667eea',
  },

  // 2. Pure White ⚪
  'pure-white': {
    bgPrimary: '#f5f7fa',
    bgSecondary: '#e8ecf1',
    bgCard: 'rgba(255, 255, 255, 0.95)',
    bgCardHover: 'rgba(248, 250, 252, 1)',
    textPrimary: '#000000',
    textSecondary: '#1a1a1a',
    textTertiary: '#4a4a4a',
    accentPrimary: '#1976d2',
    accentSecondary: '#0d47a1',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderGlow: 'rgba(25, 118, 210, 0.3)',
    shadowSoft: '0 2px 8px rgba(0, 0, 0, 0.08)',
    shadowMedium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    shadowHover: '0 8px 24px rgba(25, 118, 210, 0.15)',
    shadowGlow: '0 0 20px rgba(25, 118, 210, 0.1)',
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
  },

  // 3. Midnight Black ⚫
  'midnight-black': {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#050505',
    bgCard: 'rgba(26, 26, 26, 0.8)',
    bgCardHover: 'rgba(35, 35, 35, 0.9)',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    textTertiary: '#808080',
    accentPrimary: '#2196f3',
    accentSecondary: '#64b5f6',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderGlow: 'rgba(33, 150, 243, 0.2)',
    shadowSoft: '0 2px 12px rgba(0, 0, 0, 0.5)',
    shadowMedium: '0 8px 24px rgba(0, 0, 0, 0.6)',
    shadowHover: '0 12px 32px rgba(33, 150, 243, 0.4)',
    shadowGlow: '0 0 30px rgba(33, 150, 243, 0.2)',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  },

  // 4. Soft Pastels 🌸
  'soft-pastels': {
    bgPrimary: '#f7f3ed',
    bgSecondary: '#f0ebe5',
    bgCard: 'rgba(239, 216, 214, 0.9)',
    bgCardHover: 'rgba(229, 201, 199, 0.95)',
    textPrimary: '#2a1810',
    textSecondary: '#4a2818',
    textTertiary: '#6a4830',
    accentPrimary: '#c28b8c',
    accentSecondary: '#a67373',
    borderColor: 'rgba(194, 198, 185, 0.3)',
    borderGlow: 'rgba(194, 139, 140, 0.3)',
    shadowSoft: '0 2px 12px rgba(66, 43, 35, 0.1)',
    shadowMedium: '0 8px 24px rgba(66, 43, 35, 0.15)',
    shadowHover: '0 12px 32px rgba(194, 139, 140, 0.25)',
    shadowGlow: '0 0 30px rgba(194, 139, 140, 0.15)',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#c28b8c',
  },

  // 5. Coral Sunset 🌅
  'coral-sunset': {
    bgPrimary: '#fff8f3',
    bgSecondary: '#fff0e6',
    bgCard: 'rgba(255, 235, 224, 0.9)',
    bgCardHover: 'rgba(255, 220, 201, 0.95)',
    textPrimary: '#3a1f10',
    textSecondary: '#5a2f18',
    textTertiary: '#7a4d36',
    accentPrimary: '#ff6f3c',
    accentSecondary: '#ff5722',
    borderColor: 'rgba(255, 184, 148, 0.3)',
    borderGlow: 'rgba(255, 111, 60, 0.3)',
    shadowSoft: '0 2px 12px rgba(92, 56, 40, 0.1)',
    shadowMedium: '0 8px 24px rgba(92, 56, 40, 0.15)',
    shadowHover: '0 12px 32px rgba(255, 111, 60, 0.25)',
    shadowGlow: '0 0 30px rgba(255, 111, 60, 0.15)',
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#ff6f3c',
  },

  // 6. Lavender Dream 💜
  'lavender-dream': {
    bgPrimary: '#faf7ff',
    bgSecondary: '#f5f0ff',
    bgCard: 'rgba(240, 230, 255, 0.9)',
    bgCardHover: 'rgba(229, 215, 255, 0.95)',
    textPrimary: '#1f0f40',
    textSecondary: '#3d2466',
    textTertiary: '#5a3d80',
    accentPrimary: '#9c27b0',
    accentSecondary: '#7b1fa2',
    borderColor: 'rgba(209, 179, 245, 0.3)',
    borderGlow: 'rgba(156, 39, 176, 0.3)',
    shadowSoft: '0 2px 12px rgba(61, 36, 102, 0.1)',
    shadowMedium: '0 8px 24px rgba(61, 36, 102, 0.15)',
    shadowHover: '0 12px 32px rgba(156, 39, 176, 0.25)',
    shadowGlow: '0 0 30px rgba(156, 39, 176, 0.15)',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#9c27b0',
  },

  // 7. Mint Fresh 🌿 (with baby pink accents)
  'mint-fresh': {
    bgPrimary: '#f0fdf4',
    bgSecondary: '#fce7f0',
    bgCard: 'rgba(220, 252, 231, 0.9)',
    bgCardHover: 'rgba(252, 231, 240, 0.95)',
    textPrimary: '#052e16',
    textSecondary: '#14532d',
    textTertiary: '#166534',
    accentPrimary: '#f8b4d9',
    accentSecondary: '#059669',
    borderColor: 'rgba(248, 180, 217, 0.3)',
    borderGlow: 'rgba(248, 180, 217, 0.4)',
    shadowSoft: '0 2px 12px rgba(248, 180, 217, 0.15)',
    shadowMedium: '0 8px 24px rgba(248, 180, 217, 0.2)',
    shadowHover: '0 12px 32px rgba(248, 180, 217, 0.3)',
    shadowGlow: '0 0 30px rgba(248, 180, 217, 0.25)',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#ea580c',
    info: '#0891b2',
  },

  // 8. Ocean Breeze 🌊
  'ocean-breeze': {
    bgPrimary: '#f0f9ff',
    bgSecondary: '#e0f2fe',
    bgCard: 'rgba(224, 242, 254, 0.9)',
    bgCardHover: 'rgba(186, 230, 253, 0.95)',
    textPrimary: '#082f49',
    textSecondary: '#0c4a6e',
    textTertiary: '#075985',
    accentPrimary: '#0284c7',
    accentSecondary: '#0369a1',
    borderColor: 'rgba(125, 211, 252, 0.4)',
    borderGlow: 'rgba(2, 132, 199, 0.4)',
    shadowSoft: '0 2px 12px rgba(12, 74, 110, 0.1)',
    shadowMedium: '0 8px 24px rgba(12, 74, 110, 0.15)',
    shadowHover: '0 12px 32px rgba(2, 132, 199, 0.3)',
    shadowGlow: '0 0 30px rgba(2, 132, 199, 0.2)',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#ea580c',
    info: '#0284c7',
  },

  // 9. Midnight Latte ☕
  'midnight-latte': {
    bgPrimary: '#2c3839',
    bgSecondary: '#252e2f',
    bgCard: 'rgba(63, 78, 79, 0.8)',
    bgCardHover: 'rgba(75, 92, 93, 0.9)',
    textPrimary: '#f5f1e8',
    textSecondary: '#e8e3d6',
    textTertiary: '#c4bfb1',
    accentPrimary: '#a27b5b',
    accentSecondary: '#c9a079',
    borderColor: 'rgba(107, 90, 77, 0.3)',
    borderGlow: 'rgba(162, 123, 91, 0.3)',
    shadowSoft: '0 2px 12px rgba(0, 0, 0, 0.3)',
    shadowMedium: '0 8px 24px rgba(0, 0, 0, 0.4)',
    shadowHover: '0 12px 32px rgba(162, 123, 91, 0.3)',
    shadowGlow: '0 0 30px rgba(162, 123, 91, 0.15)',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#a27b5b',
  },

  // 10. Seasonal - Spring (Mar-May) 🌸
  'seasonal-spring': {
    bgPrimary: '#fff5f7',
    bgSecondary: '#ffebf0',
    bgCard: 'rgba(255, 232, 237, 0.9)',
    bgCardHover: 'rgba(255, 214, 224, 0.95)',
    textPrimary: '#2a0825',
    textSecondary: '#4a1942',
    textTertiary: '#6b2d62',
    accentPrimary: '#ff69b4',
    accentSecondary: '#ff1493',
    borderColor: 'rgba(255, 179, 198, 0.3)',
    borderGlow: 'rgba(255, 105, 180, 0.3)',
    shadowSoft: '0 2px 12px rgba(74, 25, 66, 0.1)',
    shadowMedium: '0 8px 24px rgba(74, 25, 66, 0.15)',
    shadowHover: '0 12px 32px rgba(255, 105, 180, 0.25)',
    shadowGlow: '0 0 30px rgba(255, 105, 180, 0.15)',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#ff69b4',
  },

  // 10. Seasonal - Summer (Jun-Aug) ☀️
  'seasonal-summer': {
    bgPrimary: '#fffbf0',
    bgSecondary: '#fff8e6',
    bgCard: 'rgba(255, 244, 214, 0.9)',
    bgCardHover: 'rgba(255, 237, 184, 0.95)',
    textPrimary: '#3a2a0a',
    textSecondary: '#5c4a1f',
    textTertiary: '#7a6430',
    accentPrimary: '#ffb347',
    accentSecondary: '#ffa500',
    borderColor: 'rgba(255, 217, 125, 0.3)',
    borderGlow: 'rgba(255, 179, 71, 0.3)',
    shadowSoft: '0 2px 12px rgba(92, 74, 31, 0.1)',
    shadowMedium: '0 8px 24px rgba(92, 74, 31, 0.15)',
    shadowHover: '0 12px 32px rgba(255, 179, 71, 0.25)',
    shadowGlow: '0 0 30px rgba(255, 179, 71, 0.15)',
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#ffb347',
  },

  // 10. Seasonal - Fall (Sep-Nov) 🍁
  'seasonal-fall': {
    bgPrimary: '#fff8f0',
    bgSecondary: '#fff0e0',
    bgCard: 'rgba(255, 232, 214, 0.9)',
    bgCardHover: 'rgba(255, 213, 176, 0.95)',
    textPrimary: '#3a1a0a',
    textSecondary: '#5c2e1f',
    textTertiary: '#7a3f2a',
    accentPrimary: '#d2691e',
    accentSecondary: '#cd853f',
    borderColor: 'rgba(255, 173, 112, 0.3)',
    borderGlow: 'rgba(210, 105, 30, 0.3)',
    shadowSoft: '0 2px 12px rgba(92, 46, 31, 0.1)',
    shadowMedium: '0 8px 24px rgba(92, 46, 31, 0.15)',
    shadowHover: '0 12px 32px rgba(210, 105, 30, 0.25)',
    shadowGlow: '0 0 30px rgba(210, 105, 30, 0.15)',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#d2691e',
  },

  // 10. Seasonal - Winter (Dec-Feb) ❄️
  'seasonal-winter': {
    bgPrimary: '#f5f5f7',
    bgSecondary: '#ededf0',
    bgCard: 'rgba(232, 232, 237, 0.9)',
    bgCardHover: 'rgba(217, 217, 227, 0.95)',
    textPrimary: '#1a1530',
    textSecondary: '#2d2a4a',
    textTertiary: '#433f5e',
    accentPrimary: '#8b7fb8',
    accentSecondary: '#9d91c7',
    borderColor: 'rgba(184, 184, 204, 0.3)',
    borderGlow: 'rgba(139, 127, 184, 0.3)',
    shadowSoft: '0 2px 12px rgba(45, 42, 74, 0.1)',
    shadowMedium: '0 8px 24px rgba(45, 42, 74, 0.15)',
    shadowHover: '0 12px 32px rgba(139, 127, 184, 0.25)',
    shadowGlow: '0 0 30px rgba(139, 127, 184, 0.15)',
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#8b7fb8',
  },

  // Seasonal main theme (placeholder, will be replaced dynamically)
  'seasonal': {
    bgPrimary: '#fff5f7',
    bgSecondary: '#ffebf0',
    bgCard: 'rgba(255, 232, 237, 0.9)',
    bgCardHover: 'rgba(255, 214, 224, 0.95)',
    textPrimary: '#2a0825',
    textSecondary: '#4a1942',
    textTertiary: '#6b2d62',
    accentPrimary: '#ff69b4',
    accentSecondary: '#ff1493',
    borderColor: 'rgba(255, 179, 198, 0.3)',
    borderGlow: 'rgba(255, 105, 180, 0.3)',
    shadowSoft: '0 2px 12px rgba(74, 25, 66, 0.1)',
    shadowMedium: '0 8px 24px rgba(74, 25, 66, 0.15)',
    shadowHover: '0 12px 32px rgba(255, 105, 180, 0.25)',
    shadowGlow: '0 0 30px rgba(255, 105, 180, 0.15)',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#ff69b4',
  },
}

// Theme metadata for UI display
export interface ThemeMetadata {
  name: string
  emoji: string
  description: string
  category: 'light' | 'dark' | 'warm' | 'cool' | 'dynamic'
}

export const themeMetadata: Record<ThemeName, ThemeMetadata> = {
  'midnight-cosmos': {
    name: 'Midnight Cosmos',
    emoji: '⭐',
    description: 'Deep space theme with purple accents and starlight',
    category: 'dark',
  },
  'pure-white': {
    name: 'Pure White',
    emoji: '⚪',
    description: 'Clean and minimal with maximum readability',
    category: 'light',
  },
  'midnight-black': {
    name: 'Midnight Black',
    emoji: '⚫',
    description: 'True black for OLED screens and night owls',
    category: 'dark',
  },
  'soft-pastels': {
    name: 'Soft Pastels',
    emoji: '🌸',
    description: 'Dreamy vintage aesthetic with dusty rose tones',
    category: 'warm',
  },
  'coral-sunset': {
    name: 'Coral Sunset',
    emoji: '🌅',
    description: 'Warm tropical vibes with sunset colors',
    category: 'warm',
  },
  'lavender-dream': {
    name: 'Lavender Dream',
    emoji: '💜',
    description: 'Calming lavender fields for peaceful focus',
    category: 'cool',
  },
  'mint-fresh': {
    name: 'Mint Fresh',
    emoji: '🌿',
    description: 'Refreshing botanical theme for natural wellness',
    category: 'cool',
  },
  'ocean-breeze': {
    name: 'Ocean Breeze',
    emoji: '🌊',
    description: 'Serene coastal blues with wave animations',
    category: 'cool',
  },
  'midnight-latte': {
    name: 'Midnight Latte',
    emoji: '☕',
    description: 'Cozy coffee shop warmth in dark mode',
    category: 'warm',
  },
  'seasonal': {
    name: 'Seasonal',
    emoji: '🌍',
    description: 'Auto-changes with the seasons for year-round freshness',
    category: 'dynamic',
  },
}

// Helper function to get the theme palette (handles seasonal themes)
export function getThemePalette(themeName: ThemeName, currentSeason?: SeasonalVariant): ThemePalette {
  if (themeName === 'seasonal' && currentSeason) {
    return themeDefinitions[`seasonal-${currentSeason}`]
  }
  return themeDefinitions[themeName]
}
