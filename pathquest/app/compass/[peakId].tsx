import React, { useMemo } from "react";
import { View, TouchableOpacity, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Navigation, Map as MapIcon } from "lucide-react-native";
import { CardFrame, PrimaryCTA, SecondaryCTA, Text, Value } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { useCompassHeading, useGPSNavigation, usePeakDetails } from "@/src/hooks";
import { normalizeDegrees } from "@/src/utils";

export default function CompassScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ peakId?: string }>();
  const peakId = typeof params.peakId === "string" ? params.peakId : "";

  const { data } = usePeakDetails(peakId);
  const peak = data?.peak;
  const peakCoords = peak?.location_coords;

  const { headingDeg } = useCompassHeading(100);

  const { nav, refresh } = useGPSNavigation({
    targetCoords: peakCoords ?? null,
    targetElevationMeters: typeof peak?.elevation === "number" ? peak.elevation : null,
    intervalMs: 1000,
  });

  const relativeRotation = useMemo(() => {
    if (headingDeg === null || nav === null) return 0;
    return normalizeDegrees(nav.bearingDeg - headingDeg);
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
    <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: insets.top + 12 }}>
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
            {nav ? `${Math.round(nav.bearingDeg)}° ${nav.bearingCardinal}` : "Waiting for GPS…"}
          </Text>
        </View>
      </View>

      {/* Compass */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
        <CardFrame variant="hero" topo="corner" ridge="none" seed={`compass:${peakId}`} style={{ width: "100%", padding: 18 }}>
          <View style={{ alignItems: "center", paddingVertical: 14 }}>
            {/* "Point here" indicator above the compass */}
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderBottomWidth: 10,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: colors.mutedForeground as any,
                }}
              />
              <Text className="text-muted-foreground text-[10px] mt-1">Point phone here</Text>
            </View>

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
                <Value className="text-foreground text-sm font-semibold">
                  {nav ? `${nav.distanceMiles.toFixed(nav.distanceMiles < 10 ? 1 : 0)} mi` : "—"}
                </Value>
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
                  <SecondaryCTA label="Refresh GPS" onPress={refresh} Icon={Navigation} />
            </View>
          </View>
        </CardFrame>
      </View>
    </View>
  );
}


