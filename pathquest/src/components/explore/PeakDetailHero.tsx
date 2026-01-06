import React from "react";
import { View } from "react-native";
import type { Peak, PeakActivity, PublicLand } from "@pathquest/shared";
import { Check, Compass as CompassIcon, FileText, MapPin, Navigation } from "lucide-react-native";
import { CardFrame, PrimaryCTA, SecondaryCTA, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { getElevationString } from "@pathquest/shared";
import { GPSStrip } from "@/src/components/shared";
import { PublicLandBadge } from "./PublicLandBadge";

export function PeakDetailHero({
  peakId,
  peak,
  locationString,
  activity,
  publicLand,
  accentColor,
  accentForeground,
  accentWash,
  accentBorder,
  hasSummited,
  isAuthenticated,
  hasUnreportedAscent,
  onOpenCompass,
  onNavigate,
  onOpenYourLogs,
  gps,
}: {
  peakId: string;
  peak: Peak;
  locationString: string;
  activity: PeakActivity | undefined;
  publicLand: PublicLand | null | undefined;
  accentColor: string;
  accentForeground: string;
  accentWash: string;
  accentBorder: string;
  hasSummited: boolean;
  isAuthenticated: boolean;
  hasUnreportedAscent: boolean;
  onOpenCompass: () => void;
  onNavigate: () => void;
  onOpenYourLogs: () => void;
  gps: { distanceMiles: number; bearingDeg: number; bearingCardinal: string; vertFeet: number | null } | null;
}) {
  const { colors, isDark } = useTheme();

  return (
    <CardFrame variant="hero" topo="full" ridge="bottom" accentColor={accentColor} seed={`peak-hero:${peakId}`} style={{ padding: 16 }}>
      {/* Accent wash */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: accentWash as any,
        }}
      />

      {/* Status chip */}
      <View style={{ position: "absolute", top: 12, right: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: `${accentColor}${isDark ? "26" : "18"}` as any,
            borderWidth: 1,
            borderColor: accentBorder as any,
          }}
        >
          <Check size={12} color={accentColor as any} />
          <Text style={{ color: accentColor as any }} className="text-[11px] font-bold tracking-wide">
            {hasSummited ? "SUMMITED" : "UNSUMMITED"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <MapPin size={16} color={accentColor as any} />
        <View style={{ flex: 1 }}>
          <Text className="text-foreground text-xl font-bold" numberOfLines={2}>
            {peak.name || "Unknown Peak"}
          </Text>
          <Text className="text-muted-foreground text-sm mt-0.5" numberOfLines={2}>
            {peak.elevation !== undefined ? getElevationString(peak.elevation, "imperial") : "Elevation —"}
            {locationString ? ` · ${locationString}` : ""}
          </Text>

          {activity ? (
            <Text className="text-muted-foreground text-xs mt-2">
              {activity.summitsThisWeek} this week · {activity.summitsThisMonth} this month
            </Text>
          ) : null}
        </View>
      </View>

      {/* Public Land Badge */}
      {publicLand ? (
        <View style={{ marginTop: 10 }}>
          <PublicLandBadge publicLand={publicLand} accentColor={accentColor} />
        </View>
      ) : null}

      <GPSStrip
        distanceText={gps ? `${gps.distanceMiles.toFixed(gps.distanceMiles < 10 ? 1 : 0)} mi` : "—"}
        bearingText={gps ? `${Math.round(gps.bearingDeg)}° ${gps.bearingCardinal}` : "—"}
        vertText={gps && typeof gps.vertFeet === "number" ? `${Math.round(gps.vertFeet).toLocaleString()} ft` : "—"}
        backgroundColor={accentWash}
        borderColor={accentBorder}
      />

      {/* Actions */}
      <View style={{ gap: 10, marginTop: 14 }}>
        {/* Row: Compass + Navigate */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SecondaryCTA label="Compass" onPress={onOpenCompass} Icon={CompassIcon} style={{ borderColor: accentBorder as any }} />
          </View>

          <View style={{ flex: 1 }}>
            {hasSummited && hasUnreportedAscent && isAuthenticated ? (
              <SecondaryCTA label="Navigate" onPress={onNavigate} Icon={Navigation} style={{ borderColor: accentBorder as any }} />
            ) : (
              <PrimaryCTA
                label="Navigate"
                onPress={onNavigate}
                Icon={Navigation}
                backgroundColor={accentColor}
                foregroundColor={accentForeground}
              />
            )}
          </View>
        </View>

        {/* Full-width primary: Add Report */}
        {hasSummited && hasUnreportedAscent && isAuthenticated ? (
          <PrimaryCTA
            label="Add Report"
            onPress={onOpenYourLogs}
            Icon={FileText}
            backgroundColor={colors.summited as string}
            foregroundColor={colors.summitedForeground as string}
          />
        ) : null}
      </View>
    </CardFrame>
  );
}


