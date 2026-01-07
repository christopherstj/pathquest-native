/**
 * ChallengePeaksOverlay
 *
 * Renders an overlay of peaks for the currently "shown on map" challenge.
 * This is separate from the normal viewport-driven `PeakMarkers` layer so we can
 * highlight a challenge's peaks even when Explore list/map data hasn't refreshed yet.
 */

import React, { useMemo, useCallback } from "react";
import { ShapeSource, CircleLayer } from "@rnmapbox/maps";
import type { Peak } from "@pathquest/shared";
import { colors } from "@/src/theme";
import { OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";

type OverlayPeak = Peak & { is_summited?: boolean };

interface ChallengePeaksOverlayProps {
  peaks: OverlayPeak[];
  isDark?: boolean;
  onPeakPress?: (peak: OverlayPeak) => void;
}

export default function ChallengePeaksOverlay({ peaks, isDark = false, onPeakPress }: ChallengePeaksOverlayProps) {
  const themeColors = isDark ? colors.dark : colors.light;

  // Create a map for quick lookup
  const peaksById = useMemo(() => {
    const map = new Map<string, OverlayPeak>();
    for (const p of peaks) {
      map.set(String(p.id), p);
    }
    return map;
  }, [peaks]);

  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: peaks
        .filter((p) => p.location_coords && p.location_coords.length === 2)
        .map((p) => ({
          type: "Feature" as const,
          id: String(p.id),
          geometry: {
            type: "Point" as const,
            coordinates: p.location_coords as [number, number],
          },
          properties: {
            id: String(p.id),
            isSummited: !!p.is_summited,
          },
        })),
    };
  }, [peaks]);

  const handlePress = useCallback((event: OnPressEvent) => {
    if (!onPeakPress) return;

    const feature = event.features?.[0];
    if (!feature) return;

    const rawId = (feature as any).properties?.id ?? (feature as any).id;
    if (rawId == null) return;

    const peakId = String(rawId);
    const peak = peaksById.get(peakId);
    if (peak) {
      onPeakPress(peak);
    }
  }, [onPeakPress, peaksById]);

  if (!peaks.length) return null;

  return (
    <ShapeSource 
      id="challenge-peaks-overlay" 
      shape={geojson}
      onPress={onPeakPress ? handlePress : undefined}
      hitbox={{ width: 30, height: 30 }}
    >
      <CircleLayer
        id="challenge-peaks-overlay-circles"
        style={{
          circleColor: [
            "case",
            ["get", "isSummited"],
            themeColors.summited,
            themeColors.primary,
          ],
          circleRadius: 8,
          circleOpacity: 0.95,
          circleStrokeWidth: 2,
          circleStrokeColor: "rgba(255, 255, 255, 0.75)",
        }}
      />
    </ShapeSource>
  );
}
