import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, View, ViewProps } from 'react-native';
import { useTheme } from '@/src/theme';
import TopoPattern from './TopoPattern';
import MountainRidge from './MountainRidge';

export type CardFrameVariant = 'default' | 'hero' | 'cta';
export type CardFrameTopo = 'none' | 'corner' | 'full';
export type CardFrameRidge = 'none' | 'bottom';

export interface CardFrameProps extends ViewProps {
  variant?: CardFrameVariant;
  topo?: CardFrameTopo;
  ridge?: CardFrameRidge;
  /**
   * Optional accent color used for subtle highlight/border details.
   * (Doesn't change the surface fill.)
   */
  accentColor?: string;
  /**
   * Seed to keep topo pattern stable across renders.
   * Use a stable string per component/card type.
   */
  seed?: string;
  /**
   * Enable accent-colored glow effect for extra visual pop.
   * When true and accentColor is provided, adds a colored shadow.
   */
  glow?: boolean;
}

const CardFrame: React.FC<CardFrameProps> = ({
  variant = 'default',
  topo = 'none',
  ridge = 'none',
  accentColor,
  seed = 'card',
  glow = false,
  style,
  children,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDims({ width, height });
  };

  const surface = colors.card;
  const border = colors.border;
  const contourInk = colors.contourInk;

  const topoConfig = useMemo(() => {
    if (topo === 'none') return null;
    // Boosted opacity for more visible topo patterns
    const opacity =
      topo === 'full'
        ? isDark
          ? 0.18
          : 0.12
        : isDark
          ? 0.2
          : 0.14;
    const lines = topo === 'full' ? 6 : 4;
    const variant = topo === 'full' ? 'full' : 'corner';
    return { opacity, lines, variant };
  }, [isDark, topo]);

  const ridgeConfig = useMemo(() => {
    if (ridge === 'none') return null;
    return {
      opacity: isDark ? 0.16 : 0.1, // Boosted ridge visibility
      height: variant === 'hero' ? 54 : 40,
      layers: variant === 'hero' ? 3 : 2,
    };
  }, [isDark, ridge, variant]);

  // Determine shadow color - use accent for glow effect
  const shadowColor = glow && accentColor ? accentColor : '#000';
  const baseShadowOpacity = variant === 'hero' ? 0.25 : variant === 'cta' ? 0.2 : 0.15;
  const glowShadowOpacity = glow && accentColor ? 0.5 : baseShadowOpacity;

  // Border color - tint with accent if provided
  const effectiveBorder = accentColor 
    ? `${accentColor}40` // 25% opacity accent border
    : border;

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: surface as any,
          borderWidth: 1,
          borderColor: effectiveBorder as any,
          shadowColor: shadowColor,
          shadowOffset: { width: 0, height: variant === 'hero' ? 12 : variant === 'cta' ? 8 : 5 },
          shadowOpacity: glowShadowOpacity,
          shadowRadius: variant === 'hero' ? 20 : variant === 'cta' ? 16 : 12,
          elevation: variant === 'hero' ? 10 : variant === 'cta' ? 8 : 6,
        },
        style,
      ]}
      {...props}
    >
      {/* Inner highlight (gives "paper" depth) - BOOSTED */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)',
        }}
      />

      {/* Topo texture */}
      {topoConfig && dims.width > 0 && dims.height > 0 && (
        <TopoPattern
          width={dims.width}
          height={dims.height}
          variant={topoConfig.variant as any}
          lines={topoConfig.lines}
          opacity={topoConfig.opacity}
          strokeWidth={1.6}
          color={contourInk}
          seed={`${seed}:${topo}`}
          showMarkers={variant === 'hero'}
        />
      )}

      {/* Optional ridge silhouette */}
      {ridgeConfig && dims.width > 0 && (
        <MountainRidge
          width={dims.width}
          height={ridgeConfig.height}
          layers={ridgeConfig.layers}
          opacity={ridgeConfig.opacity}
          color={accentColor ?? contourInk}
          variant={variant === 'hero' ? 'jagged' : 'rolling'}
          position="bottom"
        />
      )}

      {children}
    </View>
  );
};

export default CardFrame;


