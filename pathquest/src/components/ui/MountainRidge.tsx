/**
 * MountainRidge
 * 
 * SVG mountain silhouette for card decorations.
 * Creates a layered ridge effect reminiscent of vintage trail maps.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

interface MountainRidgeProps {
  width: number;
  height?: number;
  /** Base color for the mountains */
  color?: string;
  /** Opacity of the silhouette */
  opacity?: number;
  /** Number of mountain layers */
  layers?: number;
  /** Position at bottom or top of container */
  position?: 'bottom' | 'top';
  /** Style variant */
  variant?: 'jagged' | 'rolling' | 'sharp';
}

const MountainRidge: React.FC<MountainRidgeProps> = ({
  width,
  height = 40,
  color = '#A9A196',
  opacity = 0.08,
  layers = 2,
  position = 'bottom',
  variant = 'jagged',
}) => {
  // Generate jagged mountain peaks
  const generateJaggedPath = (layerIndex: number): string => {
    const baseY = height;
    const peakHeight = height * (0.6 + layerIndex * 0.15);
    const offset = layerIndex * 8;
    
    // Create irregular peaks
    const peaks = [
      { x: 0, y: baseY },
      { x: width * 0.08 + offset, y: baseY - peakHeight * 0.4 },
      { x: width * 0.15, y: baseY - peakHeight * 0.7 },
      { x: width * 0.22 + offset, y: baseY - peakHeight * 0.5 },
      { x: width * 0.32, y: baseY - peakHeight * 0.9 },
      { x: width * 0.38 + offset, y: baseY - peakHeight * 0.6 },
      { x: width * 0.48, y: baseY - peakHeight * 0.75 },
      { x: width * 0.55 + offset, y: baseY - peakHeight * 0.55 },
      { x: width * 0.65, y: baseY - peakHeight * 0.85 },
      { x: width * 0.72 + offset, y: baseY - peakHeight * 0.65 },
      { x: width * 0.82, y: baseY - peakHeight * 0.45 },
      { x: width * 0.92 + offset, y: baseY - peakHeight * 0.3 },
      { x: width, y: baseY },
    ];
    
    return peaks.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  // Generate rolling hills
  const generateRollingPath = (layerIndex: number): string => {
    const baseY = height;
    const amplitude = height * (0.4 + layerIndex * 0.1);
    const offset = layerIndex * 10;
    
    let path = `M 0 ${baseY}`;
    
    // Create smooth curves using quadratic beziers
    const points = 6;
    for (let i = 0; i < points; i++) {
      const x1 = (width / points) * i + offset;
      const x2 = (width / points) * (i + 0.5);
      const x3 = (width / points) * (i + 1);
      const peakY = baseY - amplitude * (0.5 + Math.sin(i * 1.2) * 0.5);
      
      path += ` Q ${x2} ${peakY} ${x3} ${baseY - amplitude * 0.2}`;
    }
    
    path += ` L ${width} ${baseY} Z`;
    return path;
  };

  // Generate sharp angular peaks
  const generateSharpPath = (layerIndex: number): string => {
    const baseY = height;
    const peakHeight = height * (0.7 + layerIndex * 0.1);
    const offset = layerIndex * 5;
    
    const peaks = [
      { x: 0, y: baseY },
      { x: width * 0.2, y: baseY - peakHeight * 0.3 },
      { x: width * 0.35 + offset, y: baseY - peakHeight },
      { x: width * 0.5, y: baseY - peakHeight * 0.4 },
      { x: width * 0.7 + offset, y: baseY - peakHeight * 0.85 },
      { x: width * 0.85, y: baseY - peakHeight * 0.25 },
      { x: width, y: baseY },
    ];
    
    return peaks.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  const generatePath = (layerIndex: number): string => {
    switch (variant) {
      case 'rolling':
        return generateRollingPath(layerIndex);
      case 'sharp':
        return generateSharpPath(layerIndex);
      case 'jagged':
      default:
        return generateJaggedPath(layerIndex);
    }
  };

  const paths: string[] = [];
  for (let i = 0; i < layers; i++) {
    paths.push(generatePath(i));
  }

  return (
    <View 
      style={{ 
        position: 'absolute',
        [position]: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden',
        transform: position === 'top' ? [{ rotate: '180deg' }] : undefined,
      }}
      pointerEvents="none"
    >
      <Svg width={width} height={height}>
        {paths.map((d, i) => (
          <Path
            key={i}
            d={d}
            fill={color}
            fillOpacity={opacity + i * 0.03}
          />
        ))}
      </Svg>
    </View>
  );
};

export default MountainRidge;

