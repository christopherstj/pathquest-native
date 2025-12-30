/**
 * PathQuest Theme System
 * 
 * Provides a unified theme context for the app, supporting light/dark modes
 * with the "retro topographic" color palette matching the web frontend.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { colors, type ThemeColors, type ColorScheme } from './colors';
import { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing, textStyles } from './typography';

// Re-export everything
export { colors, type ThemeColors, type ColorScheme } from './colors';
export { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing, textStyles } from './typography';

// Theme context type
interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: ThemeColors;
  fonts: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  textStyles: typeof textStyles;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedColorScheme?: ColorScheme;
}

/**
 * Theme Provider
 * 
 * Wraps the app and provides theme values via context.
 * Forces dark mode by default to match the web app.
 * Can be overridden with forcedColorScheme prop.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  forcedColorScheme 
}) => {
  // Force dark mode by default, like the web app
  const colorScheme: ColorScheme = forcedColorScheme ?? 'dark';
  
  const value = useMemo<ThemeContextValue>(() => ({
    colorScheme,
    colors: colors[colorScheme],
    fonts: fontFamilies,
    fontSizes,
    fontWeights,
    textStyles,
    isDark: colorScheme === 'dark',
  }), [colorScheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
};

/**
 * Hook to access theme values
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get just the current colors
 */
export const useColors = (): ThemeColors => {
  const { colors: themeColors } = useTheme();
  return themeColors;
};

/**
 * Common spacing values (matching typical mobile patterns)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

/**
 * Border radius values
 */
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

/**
 * Shadow presets for cards and elevated elements
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

