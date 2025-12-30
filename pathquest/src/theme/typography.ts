/**
 * PathQuest Typography
 * 
 * Matches the web frontend's font configuration:
 * - Fraunces: Display font (headings, titles)
 * - IBM Plex Mono: Data font (stats, numbers, body)
 * 
 * Note: These fonts need to be loaded via expo-font in the root layout.
 * For now, we use system fonts as fallbacks until custom fonts are configured.
 */

import { Platform } from 'react-native';

export const fontFamilies = {
  // Display font - Fraunces on web (serif with character)
  // Using Georgia on iOS, serif on Android (closest match)
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  
  // Mono font - IBM Plex Mono on web
  // Using SpaceMono on native (already bundled)
  mono: 'SpaceMono',
  
  // System sans-serif as fallback
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: undefined,
  }),
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
export const textStyles = {
  // Headings (use display font)
  h1: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.display,
  },
  h2: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.display,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.display,
  },
  h4: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.display,
  },
  
  // Body text (use mono font for data-heavy app)
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  
  // Labels and captions
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  
  // Data/stats (mono font)
  stat: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.mono,
  },
  statLarge: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    fontFamily: fontFamilies.mono,
  },
  
  // Elevation/numbers
  elevation: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.mono,
  },
} as const;

