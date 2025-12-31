import { useEffect, useMemo, useRef, useState } from "react";
import { Magnetometer } from "expo-sensors";

type HeadingState = {
  headingDeg: number | null;
  isAvailable: boolean;
};

function normalizeDegrees(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/**
 * Best-effort device heading using Magnetometer.
 * Note: This is *not* a true compass without tilt compensation, but is good enough for v1.5.
 */
export function useCompassHeading(updateIntervalMs = 100): HeadingState {
  const [headingDeg, setHeadingDeg] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // simple low-pass filter to reduce jitter
  const smoothedRef = useRef<number | null>(null);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let mounted = true;

    const start = async () => {
      try {
        const available = await Magnetometer.isAvailableAsync();
        if (!mounted) return;
        setIsAvailable(available);
        if (!available) return;

        Magnetometer.setUpdateInterval(updateIntervalMs);
        sub = Magnetometer.addListener((data) => {
          // data: { x, y, z }
          const { x, y } = data as any;
          if (typeof x !== "number" || typeof y !== "number") return;

          // heading around Z axis
          const rad = Math.atan2(y, x);
          const deg = normalizeDegrees((rad * 180) / Math.PI);

          // low-pass
          const prev = smoothedRef.current;
          const alpha = 0.18;
          const next = prev === null ? deg : normalizeDegrees(prev + alpha * (deg - prev));
          smoothedRef.current = next;
          setHeadingDeg(next);
        });
      } catch {
        if (!mounted) return;
        setIsAvailable(false);
      }
    };

    start();

    return () => {
      mounted = false;
      sub?.remove();
    };
  }, [updateIntervalMs]);

  return useMemo(() => ({ headingDeg, isAvailable }), [headingDeg, isAvailable]);
}


