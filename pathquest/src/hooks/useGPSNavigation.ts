import { useMemo } from "react";
import { bearingDegrees, bearingToCardinal, haversineMeters, metersToFeet, metersToMiles } from "@/src/utils";
import { useLocationPolling } from "./useLocationPolling";

export type GPSNav = {
  distanceMiles: number;
  bearingDeg: number;
  bearingCardinal: string;
  vertFeet: number | null;
};

export function useGPSNavigation(params: {
  targetCoords: [number, number] | null | undefined; // [lng, lat]
  targetElevationMeters?: number | null;
  intervalMs?: number;
}) {
  const { location, refresh } = useLocationPolling(params.intervalMs ?? 1000);

  const nav = useMemo<GPSNav | null>(() => {
    if (!location || !params.targetCoords) return null;
    const [lng, lat] = params.targetCoords;
    const target = { lat, lng };
    const user = { lat: location.lat, lng: location.lng };
    const meters = haversineMeters(user, target);
    const distanceMiles = metersToMiles(meters);
    const bearingDeg = bearingDegrees(user, target);

    let vertFeet: number | null = null;
    if (typeof params.targetElevationMeters === "number" && typeof location.altM === "number") {
      // Peak elevation + device altitude are both meters; compute delta in meters then convert to feet.
      vertFeet = metersToFeet(params.targetElevationMeters - location.altM);
    }

    return { distanceMiles, bearingDeg, bearingCardinal: bearingToCardinal(bearingDeg), vertFeet };
  }, [location, params.targetCoords, params.targetElevationMeters]);

  return { nav, location, refresh };
}


