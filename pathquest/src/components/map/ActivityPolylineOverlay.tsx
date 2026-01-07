import React, { useMemo } from "react";
import { ShapeSource, LineLayer } from "@rnmapbox/maps";

export default function ActivityPolylineOverlay({
  activityId,
  coords,
  color = "#1F6F4A",
  width = 3,
}: {
  activityId: string;
  coords: [number, number][];
  color?: string;
  width?: number;
}) {
  const shape = useMemo(() => {
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
      properties: {
        activityId,
      },
    };
  }, [activityId, coords]);

  if (!coords || coords.length < 2) return null;

  return (
    <ShapeSource id={`activity-line-source:${activityId}`} shape={shape}>
      <LineLayer
        id={`activity-line-layer:${activityId}`}
        style={{
          lineColor: color as any,
          lineWidth: width as any,
          lineOpacity: 0.85 as any,
          lineCap: "round" as any,
          lineJoin: "round" as any,
        }}
      />
    </ShapeSource>
  );
}


