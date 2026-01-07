import React, { useMemo } from "react";
import { ShapeSource, CircleLayer } from "@rnmapbox/maps";
import type { SummitWithPeak } from "@pathquest/shared";

export default function ActivitySummitMarkers({
  activityId,
  summits,
  color = "#4AA3FF",
}: {
  activityId: string;
  summits: SummitWithPeak[];
  color?: string;
}) {
  const features = useMemo(() => {
    const pts = (summits ?? [])
      .map((s) => {
        const c = s.peak?.location_coords;
        if (!Array.isArray(c) || c.length !== 2) return null;
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: c,
          },
          properties: {
            summitId: s.id,
            peakId: s.peak?.id,
            peakName: s.peak?.name,
          },
        };
      })
      .filter(Boolean) as any[];

    return {
      type: "FeatureCollection" as const,
      features: pts,
    };
  }, [summits]);

  if (!summits || summits.length === 0) return null;

  return (
    <ShapeSource id={`activity-summits-source:${activityId}`} shape={features}>
      <CircleLayer
        id={`activity-summits-layer:${activityId}`}
        style={{
          circleColor: color as any,
          circleRadius: 6 as any,
          circleOpacity: 0.9 as any,
          circleStrokeWidth: 2 as any,
          circleStrokeColor: "#0B0B0B" as any,
          circleStrokeOpacity: 0.35 as any,
        }}
      />
    </ShapeSource>
  );
}


