/**
 * Custom Text Components
 * 
 * Pre-styled text components with PathQuest fonts baked in:
 * - Text: Fraunces (display/serif) for headings and labels
 * - Value: IBM Plex Mono for data values, numbers, stats
 * 
 * This avoids having to add font-display/font-mono classes everywhere
 * since React Native doesn't support font inheritance.
 * 
 * IMPORTANT: In React Native, font weight is encoded in the font file name.
 * So we need to use different font families for different weights:
 * - font-display = Fraunces_400Regular
 * - font-display-bold = Fraunces_700Bold
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  children?: React.ReactNode;
}

/**
 * Helper to determine the correct font class based on weight in className
 */
const getDisplayFontClass = (className?: string): string => {
  if (!className) return 'font-display';
  
  // Check for bold weight
  if (className.includes('font-bold')) {
    return 'font-display-bold';
  }
  // Check for semibold weight
  if (className.includes('font-semibold')) {
    return 'font-display-semibold';
  }
  // Check for medium weight
  if (className.includes('font-medium')) {
    return 'font-display-medium';
  }
  
  return 'font-display';
};

/**
 * Helper to determine the correct mono font class based on weight
 */
const getMonoFontClass = (className?: string): string => {
  if (!className) return 'font-mono';
  
  if (className.includes('font-bold') || className.includes('font-semibold')) {
    return 'font-mono-semibold';
  }
  if (className.includes('font-medium')) {
    return 'font-mono-medium';
  }
  
  return 'font-mono';
};

/**
 * Helper to remove conflicting font-weight classes since they're built into the font
 */
const removeWeightClasses = (className?: string): string => {
  if (!className) return '';
  return className
    .replace(/\bfont-bold\b/g, '')
    .replace(/\bfont-semibold\b/g, '')
    .replace(/\bfont-medium\b/g, '')
    .replace(/\bfont-normal\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Text - Display/serif font (Fraunces)
 * Use for: headings, titles, labels, body text
 */
export const Text: React.FC<TextProps> = ({ className, style, ...props }) => {
  const fontClass = getDisplayFontClass(className);
  const cleanedClassName = removeWeightClasses(className);
  
  return (
    <RNText
      className={`${fontClass} ${cleanedClassName}`}
      style={style}
      {...props}
    />
  );
};

/**
 * Value - Monospace font (IBM Plex Mono)
 * Use for: numbers, stats, elevations, dates, data values
 */
export const Value: React.FC<TextProps> = ({ className, style, ...props }) => {
  const fontClass = getMonoFontClass(className);
  const cleanedClassName = removeWeightClasses(className);
  
  return (
    <RNText
      className={`${fontClass} ${cleanedClassName}`}
      style={style}
      {...props}
    />
  );
};

export default Text;

