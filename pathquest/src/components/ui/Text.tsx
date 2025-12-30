/**
 * Custom Text Components
 * 
 * Pre-styled text components with PathQuest fonts baked in:
 * - Text: Fraunces (display/serif) for headings and labels
 * - Value: IBM Plex Mono for data values, numbers, stats
 * 
 * This avoids having to add font-display/font-mono classes everywhere
 * since React Native doesn't support font inheritance.
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  children?: React.ReactNode;
}

/**
 * Text - Display/serif font (Fraunces)
 * Use for: headings, titles, labels, body text
 */
export const Text: React.FC<TextProps> = ({ className, style, ...props }) => {
  return (
    <RNText
      className={`font-display ${className ?? ''}`}
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
  return (
    <RNText
      className={`font-mono ${className ?? ''}`}
      style={style}
      {...props}
    />
  );
};

export default Text;

