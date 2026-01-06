/**
 * ChallengePeaksOverlay
 *
 * Renders an overlay of peaks for the currently “shown on map” challenge.
 * This is separate from the normal viewport-driven `PeakMarkers` layer so we can
 * highlight a challenge’s peaks even when Explore list/map data hasn’t refreshed yet.
 */

import React, { useMemo } from "react";
import { ShapeSource, CircleLayer } from "@rnmapbox/maps";
import type { Peak } from "@pathquest/shared";
import { colors } from "@/src/theme";

type OverlayPeak = Peak & { is_summited?: boolean };

interface ChallengePeaksOverlayProps {
  peaks: OverlayPeak[];
  isDark?: boolean;
}

export default function ChallengePeaksOverlay({ peaks, isDark = false }: ChallengePeaksOverlayProps) {
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
            isSummited: !!p.is_summited,
          },
        })),
    };
  }, [peaks]);

  if (!peaks.length) return null;

  return (
    <ShapeSource id="challenge-peaks-overlay" shape={geojson}>
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

      {/* subtle outer ring for extra visibility */}
      <CircleLayer
        id="challenge-peaks-overlay-ring"
        style={{
          circleRadius: 14,
          circleColor: "transparent",
          circleStrokeWidth: 2,
          circleStrokeColor: themeColors.secondary,
          circleStrokeOpacity: 0.45,
        }}
      />
    </ShapeSource>
  );
}


