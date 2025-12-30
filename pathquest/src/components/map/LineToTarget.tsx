/**
 * LineToTarget
 * 
 * Draws a line from the user's current location to a target coordinate on the map.
 * Uses Mapbox ShapeSource and LineLayer for rendering.
 */

import React, { useMemo } from 'react';
import { ShapeSource, LineLayer } from '@rnmapbox/maps';

interface LineToTargetProps {
  /** Target coordinates [longitude, latitude] */
  targetCoords: [number, number];
  /** User's current coordinates [longitude, latitude] */
  userCoords?: [number, number] | null;
  /** Line color */
  color?: string;
  /** Line width */
  width?: number;
  /** Whether to show the line */
  visible?: boolean;
}

const LineToTarget: React.FC<LineToTargetProps> = ({
  targetCoords,
  userCoords,
  color = '#5B9167', // Primary green
  width = 2,
  visible = true,
}) => {
  // Don't render if no user coords or not visible
  if (!userCoords || !visible) {
    return null;
  }

  // Create GeoJSON line feature
  const lineGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: [userCoords, targetCoords],
        },
      },
    ],
  }), [userCoords, targetCoords]);

  return (
    <ShapeSource id="line-to-target" shape={lineGeoJSON}>
      <LineLayer
        id="line-to-target-layer"
        style={{
          lineColor: color,
          lineWidth: width,
          lineOpacity: 0.8,
          lineDasharray: [2, 2], // Dashed line
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </ShapeSource>
  );
};

export default LineToTarget;

