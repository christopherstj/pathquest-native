import { useCallback, useEffect, useState } from "react";
import Mapbox from "@rnmapbox/maps";

export type LastKnownLocation = {
  lat: number;
  lng: number;
  altM: number | null;
  timestampMs: number;
} | null;

export function useLocationPolling(intervalMs = 1000) {
  const [location, setLocation] = useState<LastKnownLocation>(null);

  const refresh = useCallback(async () => {
    try {
      const loc = await Mapbox.locationManager.getLastKnownLocation();
      if (loc?.coords) {
        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          altM: typeof loc.coords.altitude === "number" ? loc.coords.altitude : null,
          timestampMs: Date.now(),
        });
      }
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      if (!mounted) return;
      await refresh();
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs, refresh]);

  return { location, refresh };
}


