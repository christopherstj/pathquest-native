/**
 * PathQuest Color Theme
 * 
 * EXACT match to the web frontend's globals.css retro topographic palette.
 * Colors converted from oklch to hex/rgba for React Native compatibility.
 * 
 * Key characteristics:
 * - Hue 80 (warm brown) for backgrounds/surfaces
 * - Hue 140 (forest green) for primary
 * - Hue 220 (sky blue) for summited indicators
 * - Semi-transparent cards for depth
 */

export const colors = {
  light: {
    // Core - Aged parchment theme
    background: '#EDE5D8',      // oklch(0.94 0.03 90) - aged parchment
    foreground: '#3D3428',      // oklch(0.26 0.06 70) - deep umber ink

    // Topographic ink (contour lines, map texture)
    contourInk: '#B6AB9B',      // warm tan ink
    contourInkSubtle: 'rgba(182, 171, 155, 0.35)',
    
    // Cards & Popovers - Slightly darker parchment
    card: 'rgba(232, 225, 212, 0.92)',  // oklch(0.93 0.02 95 / 0.92)
    cardForeground: '#3A3226',
    
    // Primary - Forest green (CTA buttons, active states)
    primary: '#4D7A57',         // oklch(0.53 0.12 140)
    primaryForeground: '#F5F2ED',
    
    // Secondary - Rust/umber
    secondary: '#C9915A',       // oklch(0.65 0.12 65)
    secondaryForeground: '#2E2418',
    
    // Muted
    muted: '#E0D9CE',           // oklch(0.88 0.02 95)
    mutedForeground: '#736B5E', // oklch(0.45 0.05 70)
    
    // Accent - Moss highlight
    accent: '#B8C9A0',          // oklch(0.78 0.05 115)
    accentForeground: '#353026',
    
    // Destructive
    destructive: '#C44536',     // oklch(0.55 0.18 30)
    destructiveForeground: '#FAF8F5',
    
    // Summited - Sky blue
    summited: '#5B9BD5',        // oklch(0.65 0.10 220)
    summitedForeground: '#F5F2ED',
    
    // Border & Input
    border: 'rgba(201, 194, 181, 0.7)', // oklch(0.8 0.03 90 / 0.7)
    input: '#E5DFD4',
    ring: 'rgba(77, 122, 87, 0.5)',
    
    // Semantic stat colors (dashboard, quick stats)
    statForest: '#5B9167',      // Forest green for peaks stat
    statTrail: '#8B7355',       // Trail brown for elevation stat
    statGold: '#C9A66B',        // Gold/rust for challenge stat
    statMuted: '#A9A196',       // Muted for inactive elements
  },
  
  dark: {
    // Core - Rich dark for better contrast
    background: '#1A1816',      // Deeper dark for more contrast
    foreground: '#F5F0E6',      // Brighter parchment for readability

    // Topographic ink (contour lines, map texture)
    contourInk: '#C4B8A8',      // Brighter warm tan ink for visibility
    contourInkSubtle: 'rgba(196, 184, 168, 0.4)',
    
    // Cards & Popovers - Semi-transparent dark
    card: 'rgba(28, 24, 20, 0.95)',     // Slightly lighter for better layering
    cardForeground: '#F5F0E6',
    
    // Primary - Vibrant emerald green
    primary: '#34D399',         // Saturated emerald - pops!
    primaryForeground: '#0F1F17',
    
    // Secondary - Vibrant amber
    secondary: '#F59E0B',       // Bright amber/gold
    secondaryForeground: '#1A1408',
    
    // Muted - Darker warm brown
    muted: '#2D2A26',           // Slightly lighter for better contrast
    mutedForeground: '#B8AFA3', // Brighter muted text
    
    // Accent - Vibrant moss green
    accent: '#22C55E',          // Bright green accent
    accentForeground: '#0A1F0F',
    
    // Destructive - Vibrant red
    destructive: '#EF4444',     // Brighter red
    destructiveForeground: '#FEF2F2',
    
    // Summited - Vibrant sky blue
    summited: '#38BDF8',        // Bright cyan-blue - really pops!
    summitedForeground: '#0C1929',
    
    // Border & Input - Warm dark tones with more presence
    border: 'rgba(82, 76, 68, 0.8)',    // More visible borders
    input: '#3D3833',           // Slightly lighter input bg
    ring: 'rgba(52, 211, 153, 0.5)',    // Match new primary
    
    // Semantic stat colors (dashboard, quick stats) - VIBRANT
    statForest: '#10B981',      // Vivid emerald for peaks stat
    statTrail: '#D97706',       // Bright amber for elevation stat
    statGold: '#FBBF24',        // Bright gold for challenge stat
    statMuted: '#9CA3AF',       // Slightly cooler muted
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = typeof colors.light | typeof colors.dark;
