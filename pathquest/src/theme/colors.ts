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
  },
  
  dark: {
    // Core - Dark warm brown (NOT gray!)
    background: '#25221E',      // oklch(0.16 0.02 80) - dark warm brown
    foreground: '#EDE5D8',      // oklch(0.93 0.03 90) - light parchment

    // Topographic ink (contour lines, map texture)
    contourInk: '#A9A196',      // warm tan ink (matches mutedForeground family)
    contourInkSubtle: 'rgba(169, 161, 150, 0.35)',
    
    // Cards & Popovers - Semi-transparent dark brown
    card: 'rgba(22, 17, 7, 0.92)',      // oklch(0.18 0.02 80 / 92%) = #161107eb
    cardForeground: '#EDE5D8',
    
    // Primary - Bright forest green
    primary: '#5B9167',         // oklch(0.62 0.12 140) - bright green
    primaryForeground: '#F5F2ED',
    
    // Secondary - Rust/amber
    secondary: '#B8845A',       // oklch(0.6 0.12 65)
    secondaryForeground: '#EDE5D8',
    
    // Muted - Darker warm brown
    muted: '#37342F',           // oklch(0.22 0.02 80)
    mutedForeground: '#A9A196', // oklch(0.7 0.04 80) - warm gray
    
    // Accent - Dark moss green
    accent: '#4A5541',          // oklch(0.35 0.04 120)
    accentForeground: '#EDE5D8',
    
    // Destructive
    destructive: '#C44536',
    destructiveForeground: '#FAF8F5',
    
    // Summited - Sky blue
    summited: '#4A8BC4',        // oklch(0.60 0.12 220)
    summitedForeground: '#F5F2ED',
    
    // Border & Input - Warm dark tones
    border: 'rgba(69, 65, 60, 0.7)',    // oklch(0.3 0.03 80 / 0.7)
    input: '#3A3632',           // oklch(0.25 0.02 80)
    ring: 'rgba(91, 145, 103, 0.5)',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = typeof colors.light;
