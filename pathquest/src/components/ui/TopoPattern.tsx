/**
 * TopoPattern
 *
 * SVG contour line pattern for retro topographic aesthetic.
 *
 * Key goals:
 * - Deterministic (seed-based): avoids “random noise” feel and prevents flicker between renders
 * - Tunable line weight/opacity: needs enough contrast to read as topo lines, especially on dark UI
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface TopoPatternProps {
  width: number;
  height: number;
  /** Number of contour lines to draw */
  lines?: number;
  /** Base color for contour lines */
  color?: string;
  /** Opacity of the lines */
  opacity?: number;
  /** Stroke width of contour lines */
  strokeWidth?: number;
  /** Whether to include elevation marker dots */
  showMarkers?: boolean;
  /** Variant style */
  variant?: 'full' | 'corner' | 'subtle';
  /** Seed to keep the pattern stable across renders */
  seed?: string;
}

function hashSeed(seed: string): number {
  // FNV-1a
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TopoPattern: React.FC<TopoPatternProps> = ({
  width,
  height,
  lines = 5,
  color = '#A9A196',
  opacity = 0.14,
  strokeWidth = 1.5,
  showMarkers = false,
  variant = 'full',
  seed = 'topo',
}) => {
  const { paths, markers } = useMemo(() => {
    const rand = mulberry32(hashSeed(`${seed}:${width}x${height}:${variant}:${lines}`));

    const generateContourPath = (index: number, total: number): string => {
      const yOffset = (height / (total + 1)) * (index + 1);
      const amplitude = 3 + rand() * 4;
      const frequency = 0.018 + rand() * 0.01;
      const phaseShift = rand() * Math.PI;

      let d = `M 0 ${yOffset}`;
      for (let x = 0; x <= width; x += 6) {
        const y = yOffset + Math.sin(x * frequency + phaseShift) * amplitude;
        d += ` L ${x} ${y}`;
      }
      return d;
    };

    const generateCornerPath = (index: number): string => {
      const offset = 16 + index * 14;
      const curve = offset * 0.62;
      return `M 0 ${offset} Q ${curve} ${curve} ${offset} 0`;
    };

    const generateSubtlePath = (): string => {
      const startX = rand() * width * 0.25;
      const startY = height * 0.25 + rand() * height * 0.5;
      const length = 40 + rand() * 70;
      const curve = 6 + rand() * 12;
      return `M ${startX} ${startY} q ${length / 2} ${curve} ${length} 0`;
    };

    const outPaths: string[] = [];
    if (variant === 'full') {
      for (let i = 0; i < lines; i++) outPaths.push(generateContourPath(i, lines));
    } else if (variant === 'corner') {
      for (let i = 0; i < Math.min(lines, 4); i++) outPaths.push(generateCornerPath(i));
    } else {
      for (let i = 0; i < lines; i++) outPaths.push(generateSubtlePath());
    }

    const outMarkers = showMarkers
      ? [
          { x: width * (0.18 + rand() * 0.08), y: height * (0.22 + rand() * 0.08) },
          { x: width * (0.72 + rand() * 0.08), y: height * (0.62 + rand() * 0.1) },
          { x: width * (0.5 + rand() * 0.1), y: height * (0.12 + rand() * 0.08) },
        ]
      : [];

    return { paths: outPaths, markers: outMarkers };
  }, [height, lines, seed, showMarkers, variant, width]);

  return (
    <View 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      <Svg width={width} height={height}>
        {paths.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={Math.max(0.04, opacity - i * 0.02)}
            fill="none"
          />
        ))}
        {markers.map((marker, i) => (
          <Circle
            key={`marker-${i}`}
            cx={marker.x}
            cy={marker.y}
            r={2.2}
            fill={color}
            fillOpacity={opacity * 0.9}
          />
        ))}
      </Svg>
    </View>
  );
};

export default TopoPattern;

