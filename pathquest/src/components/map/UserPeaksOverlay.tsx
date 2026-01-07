/**
 * UserPeaksOverlay
 *
 * Renders an overlay of a specific user's summited peaks.
 * Used when viewing a user profile inside Explore so the map can “light up”
 * with that user's accomplishments.
 */

import React, { useMemo } from "react";
import { ShapeSource, CircleLayer } from "@rnmapbox/maps";
import type { Peak } from "@pathquest/shared";
import { colors } from "@/src/theme";

/** Extract OnPressEvent type from ShapeSource's onPress prop (not publicly exported by @rnmapbox/maps) */
type OnPressEvent = Parameters<NonNullable<React.ComponentProps<typeof ShapeSource>['onPress']>>[0];

interface UserPeaksOverlayProps {
  peaks: Peak[];
  isDark?: boolean;
  onPeakPress?: (peak: Peak) => void;
}

export default function UserPeaksOverlay({ peaks, isDark = false, onPeakPress }: UserPeaksOverlayProps) {
  const themeColors = isDark ? colors.dark : colors.light;

  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: peaks
        .filter((p) => p.location_coords && p.location_coords.length === 2)
        .map((p) => ({
          type: "Feature" as const,
          id: p.id,
          geometry: {
            type: "Point" as const,
            coordinates: p.location_coords as [number, number],
          },
          properties: {
            id: p.id,
          },
        })),
    };
  }, [peaks]);

  const handlePress = (e: OnPressEvent) => {
    if (!onPeakPress || !e.features.length) return;
    const feature = e.features[0];
    const peakId = feature.properties?.id;
    const peak = peaks.find((p) => p.id === peakId);
    if (peak) {
      onPeakPress(peak);
    }
  };

  if (!peaks.length) return null;

  return (
    <ShapeSource 
      id="user-peaks-overlay" 
      shape={geojson}
      onPress={handlePress}
      hitbox={{ width: 20, height: 20 }}
    >
      <CircleLayer
        id="user-peaks-overlay-circles"
        style={{
          circleColor: themeColors.summited,
          circleRadius: 8,
          circleOpacity: 0.95,
          circleStrokeWidth: 2,
          circleStrokeColor: "rgba(255, 255, 255, 0.75)",
        }}
      />
    </ShapeSource>
  );
}


