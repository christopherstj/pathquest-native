/**
 * PathQuest Typography
 * 
 * Matches the web frontend's font configuration:
 * - Fraunces: Display font (headings, titles)
 * - IBM Plex Mono: Data font (stats, numbers, body)
 * 
 * Fonts are loaded via expo-google-fonts in the root layout.
 * NativeWind classes (font-display, font-mono) are the primary way to apply fonts.
 * These constants are exported for use in style objects when needed.
 */

/**
 * Font family names as loaded by expo-font.
 * Use these when applying fonts via style objects instead of className.
 */
export const fontFamilies = {
  // Display font - Fraunces (serif with character)
  display: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  displaySemibold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  
  // Mono font - IBM Plex Mono (data, stats, numbers)
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemibold: 'IBMPlexMono_600SemiBold',
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

// Pre-defined text styles matching web patterns
// Note: Prefer using className with font-display/font-mono classes instead
export const textStyles = {
  // Headings (use display font)
  h1: {
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.displayBold,
  },
  h2: {
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.displayBold,
  },
  h3: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.displaySemibold,
  },
  h4: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.displaySemibold,
  },
  
  // Body text (use display font for readability)
  body: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.display,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.display,
  },
  
  // Labels and captions
  label: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.displayMedium,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.display,
  },
  
  // Data/stats (mono font)
  stat: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.monoSemibold,
  },
  statLarge: {
    fontSize: fontSizes['2xl'],
    fontFamily: fontFamilies.monoSemibold,
  },
  
  // Elevation/numbers
  elevation: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.monoMedium,
  },
} as const;

