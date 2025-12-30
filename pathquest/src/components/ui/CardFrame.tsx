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
}

const CardFrame: React.FC<CardFrameProps> = ({
  variant = 'default',
  topo = 'none',
  ridge = 'none',
  accentColor,
  seed = 'card',
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
    const opacity =
      topo === 'full'
        ? isDark
          ? 0.14
          : 0.1
        : isDark
          ? 0.16
          : 0.12;
    const lines = topo === 'full' ? 6 : 4;
    const variant = topo === 'full' ? 'full' : 'corner';
    return { opacity, lines, variant };
  }, [isDark, topo]);

  const ridgeConfig = useMemo(() => {
    if (ridge === 'none') return null;
    return {
      opacity: isDark ? 0.12 : 0.08,
      height: variant === 'hero' ? 54 : 40,
      layers: variant === 'hero' ? 3 : 2,
    };
  }, [isDark, ridge, variant]);

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: surface as any,
          borderWidth: 1,
          borderColor: border as any,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: variant === 'hero' ? 10 : variant === 'cta' ? 7 : 4 },
          shadowOpacity: variant === 'hero' ? 0.2 : variant === 'cta' ? 0.16 : 0.12,
          shadowRadius: variant === 'hero' ? 18 : variant === 'cta' ? 14 : 10,
          elevation: variant === 'hero' ? 9 : variant === 'cta' ? 7 : 5,
        },
        style,
      ]}
      {...props}
    >
      {/* Inner highlight (gives “paper” depth) */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.28)',
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


