/**
 * PeakMarkers
 * 
 * Renders peak markers on the Mapbox map using ShapeSource and CircleLayer.
 * Supports:
 * - Different colors for summited vs unsummited peaks
 * - Tap interactions to select a peak
 * - Hover/selection highlighting
 */

import React, { useMemo, useCallback } from 'react';
import { ShapeSource, CircleLayer, SymbolLayer } from '@rnmapbox/maps';
import type { Peak } from '@pathquest/shared';
import { colors } from '@/src/theme';

interface PeakMarkersProps {
  peaks: Peak[];
  selectedPeakId?: string | null;
  onPeakPress?: (peak: Peak) => void;
  /**
   * Whether to use dark mode colors
   */
  isDark?: boolean;
}

const PeakMarkers: React.FC<PeakMarkersProps> = ({
  peaks,
  selectedPeakId,
  onPeakPress,
  isDark = false,
}) => {
  const themeColors = isDark ? colors.dark : colors.light;

  // Convert peaks to GeoJSON FeatureCollection
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: peaks
      .filter(peak => peak.location_coords && peak.location_coords.length === 2)
      .map(peak => ({
        type: 'Feature' as const,
        id: peak.id,
        geometry: {
          type: 'Point' as const,
          coordinates: peak.location_coords as [number, number],
        },
        properties: {
          id: peak.id,
          name: peak.name ?? 'Unknown Peak',
          elevation: peak.elevation ?? 0,
          summits: peak.summits ?? 0,
          isSummited: (peak.summits ?? 0) > 0,
          isSelected: peak.id === selectedPeakId,
        },
      })),
  }), [peaks, selectedPeakId]);

  // Handle marker press
  const handlePress = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature && onPeakPress) {
      const peakId = feature.properties?.id;
      const peak = peaks.find(p => p.id === peakId);
      if (peak) {
        onPeakPress(peak);
      }
    }
  }, [peaks, onPeakPress]);

  if (peaks.length === 0) {
    return null;
  }

  return (
    <ShapeSource
      id="peaks"
      shape={geojson}
      onPress={handlePress}
      hitbox={{ width: 20, height: 20 }}
    >
      {/* Base circle layer for all peaks */}
      <CircleLayer
        id="peaks-circle"
        style={{
          // Fill color based on summit status
          circleColor: [
            'case',
            ['get', 'isSummited'],
            themeColors.summited, // Sky blue for summited
            themeColors.primary,   // Green for not summited
          ],
          // Larger radius when selected
          circleRadius: [
            'case',
            ['get', 'isSelected'],
            10,
            7,
          ],
          // Add stroke for visibility
          circleStrokeWidth: 2,
          circleStrokeColor: [
            'case',
            ['get', 'isSelected'],
            '#ffffff',
            'rgba(255, 255, 255, 0.6)',
          ],
          // Slight opacity
          circleOpacity: 0.9,
        }}
      />

      {/* Selection ring for selected peak */}
      <CircleLayer
        id="peaks-selection-ring"
        filter={['==', ['get', 'isSelected'], true]}
        style={{
          circleRadius: 16,
          circleColor: 'transparent',
          circleStrokeWidth: 2,
          circleStrokeColor: themeColors.secondary,
          circleStrokeOpacity: 0.8,
        }}
      />
    </ShapeSource>
  );
};

export default PeakMarkers;

