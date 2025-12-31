import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Mapbox from "@rnmapbox/maps";
import { ArrowLeft, Navigation, Map as MapIcon } from "lucide-react-native";
import { CardFrame, PrimaryCTA, SecondaryCTA, Text, Value } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { useCompassHeading, usePeakDetails } from "@/src/hooks";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function normalizeDegrees(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bearingDegrees(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeDegrees(brng);
}

function bearingToCardinal(deg: number) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

function metersToMiles(m: number) {
  return m / 1609.344;
}

function metersToFeet(m: number) {
  return m * 3.28084;
}

export default function CompassScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ peakId?: string }>();
  const peakId = typeof params.peakId === "string" ? params.peakId : "";

  const { data } = usePeakDetails(peakId);
  const peak = data?.peak;
  const peakCoords = peak?.location_coords;

  const { headingDeg } = useCompassHeading(100);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number; altM: number | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const loc = await Mapbox.locationManager.getLastKnownLocation();
        if (!mounted) return;
        if (loc?.coords) {
          setUserLoc({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            altM: typeof loc.coords.altitude === "number" ? loc.coords.altitude : null,
          });
        }
      } catch {
        // best-effort
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [peakId]);

  const nav = useMemo(() => {
    if (!userLoc || !peakCoords) return null;
    const target = { lat: peakCoords[1], lng: peakCoords[0] };
    const meters = haversineMeters({ lat: userLoc.lat, lng: userLoc.lng }, target);
    const miles = metersToMiles(meters);
    const bearing = bearingDegrees({ lat: userLoc.lat, lng: userLoc.lng }, target);

    let vertFeet: number | null = null;
    if (typeof peak?.elevation === "number" && typeof userLoc.altM === "number") {
      vertFeet = peak.elevation - metersToFeet(userLoc.altM);
    }

    return {
      miles,
      bearing,
      bearingCardinal: bearingToCardinal(bearing),
      vertFeet,
    };
  }, [peak?.elevation, peakCoords, userLoc]);

  const relativeRotation = useMemo(() => {
    if (headingDeg === null || nav === null) return 0;
    return normalizeDegrees(nav.bearing - headingDeg);
  }, [headingDeg, nav]);

  const handleOpenInMaps = () => {
    if (!peakCoords) return;
    const [lng, lat] = peakCoords;
    const label = encodeURIComponent(peak?.name || "Peak");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url).catch(() => null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: 18 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border as any,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} color={colors.mutedForeground as any} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {peak?.name || "Compass"}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {nav ? `${Math.round(nav.bearing)}° ${nav.bearingCardinal}` : "Waiting for GPS…"}
          </Text>
        </View>
      </View>

      {/* Compass */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
        <CardFrame variant="hero" topo="corner" ridge="none" seed={`compass:${peakId}`} style={{ width: "100%", padding: 18 }}>
          <View style={{ alignItems: "center", paddingVertical: 14 }}>
            <View
              style={{
                width: 280,
                height: 280,
                borderRadius: 140,
                borderWidth: 2,
                borderColor: colors.border as any,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
              }}
            >
              {/* Cardinal marks */}
              <Text style={{ position: "absolute", top: 10 }} className="text-foreground text-xs font-semibold">
                N
              </Text>
              <Text style={{ position: "absolute", bottom: 10 }} className="text-muted-foreground text-xs font-semibold">
                S
              </Text>
              <Text style={{ position: "absolute", left: 10 }} className="text-muted-foreground text-xs font-semibold">
                W
              </Text>
              <Text style={{ position: "absolute", right: 10 }} className="text-muted-foreground text-xs font-semibold">
                E
              </Text>

              {/* Arrow */}
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 16,
                  borderRightWidth: 16,
                  borderBottomWidth: 42,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: colors.primary as any,
                  transform: [{ rotate: `${relativeRotation}deg` }],
                }}
              />
            </View>

            {/* Readout */}
            <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: colors.muted as any, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
                <Value className="text-foreground text-sm font-semibold">{nav ? `${nav.miles.toFixed(nav.miles < 10 ? 1 : 0)} mi` : "—"}</Value>
                <Text className="text-muted-foreground text-[10px] mt-0.5">away</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.muted as any, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
                <Value className="text-foreground text-sm font-semibold">{headingDeg === null ? "—" : `${Math.round(headingDeg)}°`}</Value>
                <Text className="text-muted-foreground text-[10px] mt-0.5">heading</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.muted as any, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
                <Value className="text-foreground text-sm font-semibold">
                  {nav && typeof nav.vertFeet === "number" ? `${Math.round(nav.vertFeet).toLocaleString()} ft` : "—"}
                </Value>
                <Text className="text-muted-foreground text-[10px] mt-0.5">vert</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryCTA label="Open in Maps" onPress={handleOpenInMaps} Icon={MapIcon} disabled={!peakCoords} />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryCTA label="Recenter GPS" onPress={() => setUserLoc(null)} Icon={Navigation} />
            </View>
          </View>
        </CardFrame>
      </View>
    </View>
  );
}


