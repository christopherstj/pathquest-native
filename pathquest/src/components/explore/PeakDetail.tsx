/**
 * PeakDetail (Phase 2)
 *
 * Implements the DESIGN.md Peak Detail experience:
 * - Hero card (CardFrame) with key peak info + GPS strip placeholders
 * - Tabs: Conditions, Community, Your Logs
 * - Real API-backed data fetching via TanStack Query
 */

import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, Linking, Platform, Pressable } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import {
  Check,
  CloudSun,
  MapPin,
  Navigation,
  Users,
  X,
  BookOpen,
  Compass as CompassIcon,
  FileText,
  Plus,
  Calendar,
  Activity,
  Thermometer,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  Wind,
  Sunrise,
  Sunset,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import type { Peak, Summit } from "@pathquest/shared";
import { getElevationString } from "@pathquest/shared";
import { useTheme } from "@/src/theme";
import { useAuthStore } from "@/src/lib/auth";
import { startStravaAuth } from "@/src/lib/auth/strava";
import { useMapStore } from "@/src/store/mapStore";
import { CardFrame, PrimaryCTA, SecondaryCTA, Text, Value } from "@/src/components/ui";
import { usePeakActivity, usePeakDetails, usePeakForecast, usePeakPublicSummitsCursor, usePeakWeather } from "@/src/hooks";

type PeakDetailTab = "conditions" | "community" | "yourLogs";

interface PeakDetailProps {
  peak: Peak;
  onClose?: () => void;
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

type LastKnownLocation = {
  longitude: number;
  latitude: number;
  altitudeMeters?: number | null;
  timestampMs?: number;
} | null;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
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
  return (brng + 360) % 360;
}

function bearingToCardinal(deg: number) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

function metersToFeet(m: number) {
  return m * 3.28084;
}

function metersToMiles(m: number) {
  return m / 1609.344;
}

function cToF(c: number) {
  return c * (9 / 5) + 32;
}

function kmhToMph(kmh: number) {
  return kmh * 0.621371;
}

// Extract IANA timezone from "(GMT-07:00) America/Boise" format
function extractIanaTimezone(timezone?: string): string | undefined {
  if (!timezone) return undefined;
  return timezone.split(" ").slice(-1)[0];
}

function formatDate(timestamp: string, timezone?: string): string {
  try {
    const date = new Date(timestamp);
    const ianaTimezone = extractIanaTimezone(timezone);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: ianaTimezone,
    });
  } catch {
    return timestamp;
  }
}

function formatTime(timestamp: string, timezone?: string): string {
  try {
    const date = new Date(timestamp);
    const ianaTimezone = extractIanaTimezone(timezone);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: ianaTimezone,
    });
  } catch {
    return "";
  }
}

function formatDateTime(timestamp: string, timezone?: string): string {
  const date = formatDate(timestamp, timezone);
  const time = formatTime(timestamp, timezone);
  return time ? `${date} at ${time}` : date;
}

// Weather code to icon/description mapping (WMO codes)
type WeatherInfo = {
  icon: typeof Sun;
  label: string;
};

function getWeatherInfo(code: number | null): WeatherInfo {
  if (code === null) return { icon: CloudSun, label: "Unknown" };
  
  // Clear sky
  if (code === 0) return { icon: Sun, label: "Clear" };
  // Mainly clear, partly cloudy
  if (code >= 1 && code <= 2) return { icon: CloudSun, label: "Partly cloudy" };
  // Overcast
  if (code === 3) return { icon: Cloud, label: "Overcast" };
  // Fog
  if (code >= 45 && code <= 48) return { icon: CloudFog, label: "Foggy" };
  // Drizzle
  if (code >= 51 && code <= 57) return { icon: CloudRain, label: "Drizzle" };
  // Rain
  if (code >= 61 && code <= 67) return { icon: CloudRain, label: "Rain" };
  // Snow
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: "Snow" };
  // Rain showers
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: "Showers" };
  // Snow showers
  if (code >= 85 && code <= 86) return { icon: CloudSnow, label: "Snow showers" };
  // Thunderstorm
  if (code >= 95 && code <= 99) return { icon: CloudRain, label: "Thunderstorm" };
  
  return { icon: CloudSun, label: "Unknown" };
}

// Score a day for summit conditions (lower is better)
type DayRating = "good" | "fair" | "poor";

function getDayRating(
  precipProb: number | null,
  windSpeed: number | null,
  cloudCover: number | null
): DayRating {
  const precip = precipProb ?? 0;
  const wind = windSpeed ?? 0;
  const clouds = cloudCover ?? 0;
  
  // Poor conditions
  if (precip > 50 || wind > 50) return "poor";
  
  // Fair conditions
  if (precip > 20 || wind > 30 || clouds > 70) return "fair";
  
  // Good conditions
  return "good";
}

function SummitCard({
  summit,
  userLabel,
}: {
  summit: Summit & { user_id?: string; user_name?: string };
  userLabel?: string;
}) {
  const { colors } = useTheme();
  const note = summit.notes?.trim();
  const tags = summit.condition_tags ?? [];
  const tempF = summit.temperature != null ? Math.round(cToF(summit.temperature)) : null;
  const precipMm = summit.precipitation;
  const cloudPct = summit.cloud_cover;
  const showPrecip = precipMm != null && precipMm > 0;
  const hasWeatherData = tempF != null || showPrecip || cloudPct != null;

  return (
    <CardFrame topo="corner" seed={`summit:${summit.id}`} style={{ padding: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text className="text-foreground text-sm font-semibold">
          {userLabel ?? summit.user_name ?? "Explorer"}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {formatDateTime(summit.timestamp, summit.timezone)}
        </Text>
      </View>

      {/* Weather data row */}
      {hasWeatherData ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
          {tempF != null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Thermometer size={11} color={colors.mutedForeground as any} />
              <Text className="text-muted-foreground text-[11px]">{tempF}°F</Text>
            </View>
          ) : null}
          {showPrecip ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <CloudRain size={11} color={colors.mutedForeground as any} />
              <Text className="text-muted-foreground text-[11px]">{precipMm!.toFixed(1)}mm</Text>
            </View>
          ) : null}
          {cloudPct != null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Cloud size={11} color={colors.mutedForeground as any} />
              <Text className="text-muted-foreground text-[11px]">{cloudPct}%</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {tags.length > 0 ? (
        <Text className="text-muted-foreground text-xs mt-1">
          {tags.slice(0, 4).join(" · ")}
          {tags.length > 4 ? " …" : ""}
        </Text>
      ) : null}

      {note ? (
        <Text className="text-foreground text-sm mt-2" numberOfLines={4}>
          {note}
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm mt-2">No notes.</Text>
      )}
    </CardFrame>
  );
}

export default function PeakDetail({ peak, onClose }: PeakDetailProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PeakDetailTab>("conditions");
  const [lastKnown, setLastKnown] = useState<LastKnownLocation>(null);

  const peakId = peak.id;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const setSelectionMode = useMapStore((s) => s.setSelectionMode);

  const { data: peakDetails, isLoading: peakLoading } = usePeakDetails(peakId);
  const { data: activity } = usePeakActivity(peakId);
  const { data: weather, isLoading: weatherLoading } = usePeakWeather(peakId);
  const { data: forecast, isLoading: forecastLoading } = usePeakForecast(peakId);
  const {
    data: publicSummitsPages,
    isLoading: publicSummitsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePeakPublicSummitsCursor(peakId, 20);

  const resolvedPeak = peakDetails?.peak ?? peak;
  const peakCoords = resolvedPeak.location_coords;
  const userSummits = resolvedPeak.summits ?? 0;
  const yourAscents = useMemo(() => {
    const ascents = resolvedPeak.ascents ?? [];
    // Sort by timestamp descending (most recent first)
    return [...ascents].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }, [resolvedPeak.ascents]);
  const ascentCount = yourAscents.length;
  const hasSummited = userSummits > 0 || ascentCount > 0;
  
  // Check if any ascents are unreported (no notes/trip report)
  const unreportedAscents = yourAscents.filter((a) => !a.notes?.trim());
  const hasUnreportedAscent = unreportedAscents.length > 0;
  
  const accentColor = hasSummited ? (colors.summited as string) : (colors.primary as string);
  const accentForeground = hasSummited ? (colors.summitedForeground as string) : (colors.primaryForeground as string);
  const accentWash = `${accentColor}${isDark ? "18" : "12"}`;
  const accentBorder = `${accentColor}${isDark ? "55" : "3A"}`;
  
  // Flatten public summits from paginated data
  const publicSummits = publicSummitsPages?.pages.flatMap((p) => p.summits) ?? [];
  
  // Aggregate condition tags from recent public summits
  const recentConditionTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    const recentSummits = publicSummits.slice(0, 20); // Last 20 summits
    recentSummits.forEach((s) => {
      (s.condition_tags ?? []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 tags
  }, [publicSummits]);
  
  // Get 2 most recent reports with notes
  const recentReportsWithNotes = useMemo(() => {
    return publicSummits
      .filter((s) => s.notes?.trim())
      .slice(0, 2);
  }, [publicSummits]);

  const locationString = useMemo(() => {
    const parts = [resolvedPeak.county, resolvedPeak.state, resolvedPeak.country].filter(Boolean);
    return parts.join(", ");
  }, [resolvedPeak.county, resolvedPeak.country, resolvedPeak.state]);

  // Keep GPS strip “fresh-ish”: poll lastKnownLocation every 5s while Peak Detail is open.
  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      try {
        const loc = await Mapbox.locationManager.getLastKnownLocation();
        if (!mounted) return;
        if (loc?.coords) {
          setLastKnown({
            longitude: loc.coords.longitude,
            latitude: loc.coords.latitude,
            altitudeMeters: loc.coords.altitude ?? null,
            timestampMs: typeof loc.timestamp === "number" ? loc.timestamp : Date.now(),
          });
        }
      } catch {
        // best-effort
      }
    };

    tick();
    const id = setInterval(tick, 5000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [peakId]);

  const gps = useMemo(() => {
    if (!peakCoords || !lastKnown) return null;
    const user = { lat: lastKnown.latitude, lng: lastKnown.longitude };
    const target = { lat: peakCoords[1], lng: peakCoords[0] };
    const meters = haversineMeters(user, target);
    const miles = metersToMiles(meters);
    const bearing = bearingDegrees(user, target);

    let vertFeet: number | null = null;
    if (typeof resolvedPeak.elevation === "number" && typeof lastKnown.altitudeMeters === "number") {
      vertFeet = resolvedPeak.elevation - metersToFeet(lastKnown.altitudeMeters);
    }

    return {
      distanceMiles: miles,
      bearingDeg: bearing,
      bearingCardinal: bearingToCardinal(bearing),
      vertFeet,
    };
  }, [lastKnown, peakCoords, resolvedPeak.elevation]);

  const handleShowOnMap = () => {
    // Keep selection but return to floating card mode.
    setSelectionMode("floating");
  };

  const handleNavigate = () => {
    if (!peakCoords) return;
    const [lng, lat] = peakCoords;
    const label = encodeURIComponent(resolvedPeak.name || "Peak");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url).catch(() => null);
  };

  const handleOpenCompass = () => {
    router.push({ pathname: "/compass/[peakId]", params: { peakId } });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flex: 1 }}>
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {resolvedPeak.name || "Peak"}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {peakLoading ? "Loading…" : locationString || " "}
          </Text>
        </View>

        {onClose ? (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border as any,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={colors.mutedForeground as any} />
          </TouchableOpacity>
        ) : null}
      </View>

      <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Hero */}
        <CardFrame
          variant="hero"
          topo="full"
          ridge="bottom"
          accentColor={accentColor}
          seed={`peak-hero:${peakId}`}
          style={{ padding: 16 }}
        >
          {/* Subtle accent wash to make the hero feel “alive” */}
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
                {resolvedPeak.name || "Unknown Peak"}
              </Text>
              <Text className="text-muted-foreground text-sm mt-0.5" numberOfLines={2}>
                {resolvedPeak.elevation !== undefined ? getElevationString(resolvedPeak.elevation, "imperial") : "Elevation —"}
                {locationString ? ` · ${locationString}` : ""}
              </Text>

              {/* Activity strip */}
              {activity ? (
                <Text className="text-muted-foreground text-xs mt-2">
                  {activity.summitsThisWeek} this week · {activity.summitsThisMonth} this month
                </Text>
              ) : null}
            </View>
          </View>

          {/* GPS strip */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: accentWash as any,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: accentBorder as any,
              }}
            >
              <Value className="text-foreground text-sm font-semibold">
                {gps ? `${gps.distanceMiles.toFixed(gps.distanceMiles < 10 ? 1 : 0)} mi` : "—"}
              </Value>
              <Text className="text-muted-foreground text-[10px] mt-0.5">away</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: accentWash as any,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: accentBorder as any,
              }}
            >
              <Value className="text-foreground text-sm font-semibold">
                {gps ? `${Math.round(gps.bearingDeg)}° ${gps.bearingCardinal}` : "—"}
              </Value>
              <Text className="text-muted-foreground text-[10px] mt-0.5">bearing</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: accentWash as any,
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: accentBorder as any,
              }}
            >
              <Value className="text-foreground text-sm font-semibold">
                {gps && typeof gps.vertFeet === "number" ? `${Math.round(gps.vertFeet).toLocaleString()} ft` : "—"}
              </Value>
              <Text className="text-muted-foreground text-[10px] mt-0.5">vert</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 10, marginTop: 14 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SecondaryCTA label="Show on Map" onPress={handleShowOnMap} Icon={MapPin} style={{ borderColor: accentBorder as any }} />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryCTA label="Compass" onPress={handleOpenCompass} Icon={CompassIcon} style={{ borderColor: accentBorder as any }} />
              </View>
            </View>
            {/* Context-aware CTAs */}
            {hasSummited && hasUnreportedAscent && isAuthenticated ? (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryCTA label="Navigate" onPress={handleNavigate} Icon={Navigation} style={{ borderColor: accentBorder as any }} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryCTA
                    label="Add Report"
                    onPress={() => setActiveTab("yourLogs")}
                    Icon={FileText}
                    backgroundColor={colors.summited as string}
                    foregroundColor={colors.summitedForeground as string}
                  />
                </View>
              </View>
            ) : (
              <PrimaryCTA
                label="Navigate"
                onPress={handleNavigate}
                Icon={Navigation}
                backgroundColor={accentColor}
                foregroundColor={accentForeground}
              />
            )}
          </View>
        </CardFrame>

        {/* Tabs */}
        <View className="flex-row mt-4 mb-3 p-1 rounded-lg bg-muted gap-1">
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${activeTab === "conditions" ? "bg-background" : ""}`}
            onPress={() => setActiveTab("conditions")}
            activeOpacity={0.7}
          >
            <Text className={`text-[13px] font-medium ${activeTab === "conditions" ? "text-foreground" : "text-muted-foreground"}`}>
              Conditions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${activeTab === "community" ? "bg-background" : ""}`}
            onPress={() => setActiveTab("community")}
            activeOpacity={0.7}
          >
            <Text className={`text-[13px] font-medium ${activeTab === "community" ? "text-foreground" : "text-muted-foreground"}`}>
              Community
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-2 px-3 rounded-lg ${activeTab === "yourLogs" ? "bg-background" : ""}`}
            onPress={() => setActiveTab("yourLogs")}
            activeOpacity={0.7}
          >
            <Text className={`text-[13px] font-medium ${activeTab === "yourLogs" ? "text-foreground" : "text-muted-foreground"}`}>
              Your Logs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab content */}
        {activeTab === "conditions" ? (
          <View style={{ gap: 12 }}>
            {/* Weather card */}
            <CardFrame topo="corner" seed={`conditions:${peakId}`} style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <CloudSun size={18} color={colors.mutedForeground as any} />
                <Text className="text-foreground text-base font-semibold">Current Weather</Text>
              </View>

              {weatherLoading ? (
                <Text className="text-muted-foreground text-sm mt-3">Loading weather…</Text>
              ) : weather ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Text className="text-muted-foreground text-sm">
                    Temp:{" "}
                    <Text className="text-foreground">
                      {weather.temperature === null ? "—" : `${Math.round(cToF(weather.temperature))}°F`}
                    </Text>
                    {weather.feelsLike === null ? "" : ` (feels like ${Math.round(cToF(weather.feelsLike))}°F)`}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Wind:{" "}
                    <Text className="text-foreground">
                      {weather.windSpeed === null ? "—" : `${Math.round(kmhToMph(weather.windSpeed))} mph`}
                    </Text>
                    {weather.windDirection === null ? "" : ` · ${Math.round(weather.windDirection)}°`}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Humidity: <Text className="text-foreground">{weather.humidity === null ? "—" : `${weather.humidity}%`}</Text>
                  </Text>
                </View>
              ) : (
                <Text className="text-muted-foreground text-sm mt-3">No weather available.</Text>
              )}
            </CardFrame>

            {/* 7-Day Summit Forecast */}
            {forecast && forecast.daily.length > 0 ? (
              <View style={{ marginHorizontal: -16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, paddingHorizontal: 16 }}>
                  <Calendar size={18} color={colors.mutedForeground as any} />
                  <Text className="text-foreground text-base font-semibold">7-Day Summit Window</Text>
                </View>
                <GHScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
                >
                  {forecast.daily.map((day) => {
                    const weatherInfo = getWeatherInfo(day.weatherCode);
                    const WeatherIcon = weatherInfo.icon;
                    const rating = getDayRating(day.precipProbability, day.windSpeed, day.cloudCover);
                    const ratingColor = rating === "good"
                      ? colors.primary
                      : rating === "fair"
                      ? colors.secondary
                      : colors.destructive;
                    // Parse date as local date (YYYY-MM-DD format from API)
                    const dayDate = new Date(day.date + "T12:00:00");
                    const today = new Date();
                    const isToday =
                      dayDate.getFullYear() === today.getFullYear() &&
                      dayDate.getMonth() === today.getMonth() &&
                      dayDate.getDate() === today.getDate();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const isTomorrow =
                      dayDate.getFullYear() === tomorrow.getFullYear() &&
                      dayDate.getMonth() === tomorrow.getMonth() &&
                      dayDate.getDate() === tomorrow.getDate();
                    const dayName = isToday
                      ? "Today"
                      : isTomorrow
                      ? "Tmrw"
                      : dayDate.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = dayDate.getDate();
                    const tempHighF = day.tempHigh != null ? Math.round(cToF(day.tempHigh)) : null;
                    const tempLowF = day.tempLow != null ? Math.round(cToF(day.tempLow)) : null;
                    const precipProb = day.precipProbability ?? 0;

                    return (
                      <CardFrame
                        key={day.date}
                        topo="none"
                        seed={`forecast-day:${day.date}`}
                        style={{
                          alignItems: "center",
                          padding: 12,
                          minWidth: 85,
                        }}
                      >
                        <Text className="text-foreground text-sm font-semibold">{dayName}</Text>
                        <Text className="text-muted-foreground text-xs">{dayNum}</Text>
                        <WeatherIcon size={28} color={colors.foreground as any} style={{ marginVertical: 8 }} />
                        {tempHighF != null && tempLowF != null ? (
                          <View style={{ alignItems: "center" }}>
                            <Text className="text-foreground text-base font-bold">{tempHighF}°</Text>
                            <Text className="text-muted-foreground text-xs">{tempLowF}°</Text>
                          </View>
                        ) : null}
                        {/* Precipitation */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 }}>
                          <CloudRain size={12} color={colors.mutedForeground as any} />
                          <Text className="text-muted-foreground text-xs">{precipProb}%</Text>
                        </View>
                        {/* Rating badge */}
                        <View
                          style={{
                            marginTop: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 999,
                            backgroundColor: `${ratingColor}20`,
                          }}
                        >
                          <Text style={{ color: ratingColor, fontSize: 10, fontWeight: "600" }}>
                            {rating.toUpperCase()}
                          </Text>
                        </View>
                      </CardFrame>
                    );
                  })}
                </GHScrollView>
              </View>
            ) : forecastLoading ? (
              <CardFrame topo="none" seed={`forecast-loading:${peakId}`} style={{ padding: 14 }}>
                <Text className="text-muted-foreground text-sm">Loading forecast…</Text>
              </CardFrame>
            ) : null}

            {/* Daylight Info */}
            {forecast && (forecast.sunrise || forecast.sunset) ? (
              <CardFrame topo="corner" seed={`daylight:${peakId}`} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Sun size={18} color={colors.mutedForeground as any} />
                  <Text className="text-foreground text-base font-semibold">Today's Daylight</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
                  {forecast.sunrise ? (
                    <View style={{ alignItems: "center" }}>
                      <Sunrise size={20} color={colors.secondary as any} />
                      <Text className="text-foreground text-sm font-medium mt-1">
                        {new Date(forecast.sunrise).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </Text>
                      <Text className="text-muted-foreground text-[10px]">Sunrise</Text>
                    </View>
                  ) : null}
                  {forecast.daylightSeconds ? (
                    <View style={{ alignItems: "center" }}>
                      <Text className="text-foreground text-lg font-bold">
                        {Math.floor(forecast.daylightSeconds / 3600)}h {Math.round((forecast.daylightSeconds % 3600) / 60)}m
                      </Text>
                      <Text className="text-muted-foreground text-[10px]">Daylight</Text>
                    </View>
                  ) : null}
                  {forecast.sunset ? (
                    <View style={{ alignItems: "center" }}>
                      <Sunset size={20} color={colors.primary as any} />
                      <Text className="text-foreground text-sm font-medium mt-1">
                        {new Date(forecast.sunset).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </Text>
                      <Text className="text-muted-foreground text-[10px]">Sunset</Text>
                    </View>
                  ) : null}
                </View>
              </CardFrame>
            ) : null}

            {/* Recent conditions from reports */}
            {recentConditionTags.length > 0 ? (
              <CardFrame topo="corner" seed={`recent-conditions:${peakId}`} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Activity size={18} color={colors.mutedForeground as any} />
                  <Text className="text-foreground text-base font-semibold">Recent Conditions</Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {recentConditionTags.map(([tag, count]) => (
                    <View
                      key={tag}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.muted as any,
                      }}
                    >
                      <Text className="text-foreground text-xs font-medium">{tag}</Text>
                      <Text className="text-muted-foreground text-[10px]">({count})</Text>
                    </View>
                  ))}
                </View>
              </CardFrame>
            ) : null}

            {/* Recent reports with notes */}
            {recentReportsWithNotes.length > 0 ? (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <FileText size={16} color={colors.mutedForeground as any} />
                  <Text className="text-muted-foreground text-sm font-medium">Recent Reports</Text>
                </View>
                {recentReportsWithNotes.map((s) => {
                  const tempF = s.temperature != null ? Math.round(cToF(s.temperature)) : null;
                  const precipMm = s.precipitation;
                  const cloudPct = s.cloud_cover;
                  const showPrecip = precipMm != null && precipMm > 0;
                  const hasWeatherData = tempF != null || showPrecip || cloudPct != null;
                  return (
                    <CardFrame key={s.id} topo="corner" seed={`recent-report:${s.id}`} style={{ padding: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text className="text-foreground text-sm font-semibold">
                          {s.user_name ?? "Explorer"}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {formatDateTime(s.timestamp, s.timezone)}
                        </Text>
                      </View>
                      {/* Weather data row */}
                      {hasWeatherData ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                          {tempF != null ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Thermometer size={11} color={colors.mutedForeground as any} />
                              <Text className="text-muted-foreground text-[11px]">{tempF}°F</Text>
                            </View>
                          ) : null}
                          {showPrecip ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <CloudRain size={11} color={colors.mutedForeground as any} />
                              <Text className="text-muted-foreground text-[11px]">{precipMm!.toFixed(1)}mm</Text>
                            </View>
                          ) : null}
                          {cloudPct != null ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Cloud size={11} color={colors.mutedForeground as any} />
                              <Text className="text-muted-foreground text-[11px]">{cloudPct}%</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      {(s.condition_tags ?? []).length > 0 ? (
                        <Text className="text-muted-foreground text-xs mt-1">
                          {(s.condition_tags ?? []).slice(0, 3).join(" · ")}
                        </Text>
                      ) : null}
                      <Text className="text-foreground text-sm mt-2" numberOfLines={3}>
                        {s.notes}
                      </Text>
                    </CardFrame>
                  );
                })}
              </View>
            ) : !publicSummitsLoading && publicSummits.length === 0 ? (
              <CardFrame topo="none" seed={`no-reports:${peakId}`} style={{ padding: 14 }}>
                <Text className="text-muted-foreground text-sm">No condition reports yet. Be the first to share!</Text>
              </CardFrame>
            ) : null}
          </View>
        ) : null}

        {activeTab === "community" ? (
          <View style={{ gap: 12 }}>
            {/* Activity summary header */}
            {activity ? (
              <CardFrame topo="corner" seed={`community-activity:${peakId}`} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Activity size={18} color={colors.primary as any} />
                    <Text className="text-foreground text-base font-semibold">Peak Activity</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
                  <View style={{ alignItems: "center" }}>
                    <Value className="text-foreground text-lg font-bold">{activity.summitsThisWeek}</Value>
                    <Text className="text-muted-foreground text-[10px]">this week</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Value className="text-foreground text-lg font-bold">{activity.summitsThisMonth}</Value>
                    <Text className="text-muted-foreground text-[10px]">this month</Text>
                  </View>
                  {publicSummitsPages?.pages?.[0]?.totalCount ? (
                    <View style={{ alignItems: "center" }}>
                      <Value className="text-foreground text-lg font-bold">{publicSummitsPages.pages[0].totalCount}</Value>
                      <Text className="text-muted-foreground text-[10px]">all time</Text>
                    </View>
                  ) : null}
                </View>
              </CardFrame>
            ) : null}

            {/* Public summits header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Users size={18} color={colors.mutedForeground as any} />
              <Text className="text-foreground text-base font-semibold">Recent Reports</Text>
            </View>

            {publicSummitsLoading ? (
              <Text className="text-muted-foreground text-sm">Loading community…</Text>
            ) : publicSummits.length > 0 ? (
              <View style={{ gap: 10 }}>
                {publicSummits.map((s) => (
                  <SummitCard key={s.id} summit={s} />
                ))}

                {hasNextPage ? (
                  <View style={{ marginTop: 4 }}>
                    <SecondaryCTA
                      label={isFetchingNextPage ? "Loading…" : "Load more"}
                      onPress={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <CardFrame topo="none" seed={`community-empty:${peakId}`} style={{ padding: 14 }}>
                <Text className="text-muted-foreground text-sm">No public summits yet. Be the first!</Text>
              </CardFrame>
            )}
          </View>
        ) : null}

        {activeTab === "yourLogs" ? (
          <View style={{ gap: 12 }}>
            {!isAuthenticated ? (
              <CardFrame topo="corner" seed={`logs-login:${peakId}`} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <BookOpen size={18} color={colors.mutedForeground as any} />
                  <Text className="text-foreground text-base font-semibold">Your Summit Journal</Text>
                </View>
                <Text className="text-muted-foreground text-sm mt-3">Sign in to track your summits and add trip reports.</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryCTA label="Connect with Strava" onPress={() => startStravaAuth()} />
                </View>
              </CardFrame>
            ) : yourAscents.length > 0 ? (
              <>
                {/* Summit count header */}
                <CardFrame topo="corner" seed={`your-summit-count:${peakId}`} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Check size={18} color={colors.summited as any} />
                    <Text className="text-foreground text-base font-semibold">
                      You've summited this peak {ascentCount} {ascentCount === 1 ? "time" : "times"}
                    </Text>
                  </View>
                  {hasUnreportedAscent ? (
                    <Text className="text-muted-foreground text-xs mt-2">
                      {unreportedAscents.length} {unreportedAscents.length === 1 ? "summit" : "summits"} without a trip report
                    </Text>
                  ) : (
                    <Text className="text-primary text-xs mt-2">All summits have trip reports!</Text>
                  )}
                </CardFrame>

                {/* Ascent cards with report status */}
                <View style={{ gap: 10 }}>
                  {yourAscents.map((a) => {
                    const hasReport = !!a.notes?.trim();
                    const source = (a as any).source ?? "strava"; // "strava" or "manual"
                    const tempF = a.temperature != null ? Math.round(cToF(a.temperature)) : null;
                    const precipMm = a.precipitation;
                    const cloudPct = a.cloud_cover;
                    const showPrecip = precipMm != null && precipMm > 0;
                    const hasWeatherData = tempF != null || showPrecip || cloudPct != null;
                    return (
                      <CardFrame key={a.id} topo="corner" seed={`your-ascent:${a.id}`} style={{ padding: 12 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Calendar size={14} color={colors.mutedForeground as any} />
                              <Text className="text-foreground text-sm font-semibold">
                                {formatDateTime(a.timestamp, a.timezone)}
                              </Text>
                            </View>
                            <Text className="text-muted-foreground text-xs mt-2">
                              via {source === "manual" ? "Manual entry" : "Strava sync"}
                            </Text>
                            {/* Weather data row */}
                            {hasWeatherData ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                                {tempF != null ? (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <Thermometer size={11} color={colors.mutedForeground as any} />
                                    <Text className="text-muted-foreground text-[11px]">{tempF}°F</Text>
                                  </View>
                                ) : null}
                                {showPrecip ? (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <CloudRain size={11} color={colors.mutedForeground as any} />
                                    <Text className="text-muted-foreground text-[11px]">{precipMm!.toFixed(1)}mm</Text>
                                  </View>
                                ) : null}
                                {cloudPct != null ? (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                    <Cloud size={11} color={colors.mutedForeground as any} />
                                    <Text className="text-muted-foreground text-[11px]">{cloudPct}%</Text>
                                  </View>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                          {/* Report status badge */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: hasReport
                                ? `${colors.summited}${isDark ? "20" : "15"}`
                                : `${colors.secondary}${isDark ? "20" : "15"}`,
                            }}
                          >
                            {hasReport ? (
                              <Check size={10} color={colors.summited as any} />
                            ) : (
                              <FileText size={10} color={colors.secondary as any} />
                            )}
                            <Text
                              style={{ color: hasReport ? colors.summited : colors.secondary }}
                              className="text-[10px] font-medium"
                            >
                              {hasReport ? "Reported" : "No report"}
                            </Text>
                          </View>
                        </View>

                        {/* Condition tags - always show if present */}
                        {(a.condition_tags ?? []).length > 0 ? (
                          <View style={{ marginTop: 10 }}>
                            <Text className="text-muted-foreground text-xs">
                              {(a.condition_tags ?? []).slice(0, 4).join(" · ")}
                              {(a.condition_tags ?? []).length > 4 ? " …" : ""}
                            </Text>
                          </View>
                        ) : null}

                        {/* Show notes excerpt if reported */}
                        {hasReport ? (
                          <View style={{ marginTop: (a.condition_tags ?? []).length > 0 ? 6 : 10 }}>
                            <Text className="text-foreground text-sm" numberOfLines={3}>
                              {a.notes}
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => {
                              // TODO: Open Add Report modal for this ascent
                              console.log("Add report for ascent:", a.id);
                            }}
                            style={({ pressed }) => [
                              {
                                marginTop: 12,
                                borderRadius: 10,
                                overflow: "hidden",
                                minHeight: 44,
                                shadowColor: colors.primary as string,
                                shadowOffset: { width: 0, height: pressed ? 1 : 2 },
                                shadowOpacity: pressed ? 0.15 : 0.25,
                                shadowRadius: pressed ? 3 : 6,
                                elevation: pressed ? 2 : 4,
                                transform: [{ translateY: pressed ? 1 : 0 }],
                              },
                            ]}
                          >
                            {({ pressed }) => (
                              <>
                                {/* Background layer */}
                                <View
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: pressed ? `${colors.summited}25` : `${colors.summited}12`,
                                    borderRadius: 10,
                                  }}
                                  pointerEvents="none"
                                />
                                {/* Content */}
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                  }}
                                >
                                  <Plus size={16} color={colors.summited as any} />
                                  <Text style={{ color: colors.summited }} className="text-sm font-semibold">
                                    Add Trip Report
                                  </Text>
                                </View>
                              </>
                            )}
                          </Pressable>
                        )}
                      </CardFrame>
                    );
                  })}
                </View>

                {/* Manual summit CTA */}
                <CardFrame topo="none" seed={`manual-summit-cta:${peakId}`} style={{ padding: 14 }}>
                  <Text className="text-muted-foreground text-sm text-center">
                    Climbed this peak without Strava?
                  </Text>
                  <Pressable
                    onPress={() => {
                      // TODO: Open Manual Summit modal
                      console.log("Log manual summit for peak:", peakId);
                    }}
                    style={({ pressed }) => [
                      {
                        marginTop: 12,
                        borderRadius: 10,
                        overflow: "hidden",
                        minHeight: 44,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: pressed ? 1 : 2 },
                        shadowOpacity: pressed ? 0.06 : 0.1,
                        shadowRadius: pressed ? 3 : 6,
                        elevation: pressed ? 2 : 4,
                        transform: [{ translateY: pressed ? 1 : 0 }],
                      },
                    ]}
                  >
                    {({ pressed }) => (
                      <>
                        {/* Background layer */}
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: pressed ? (colors.muted as string) : "transparent",
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: colors.border as any,
                          }}
                          pointerEvents="none"
                        />
                        {/* Content */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                          }}
                        >
                          <Plus size={16} color={colors.mutedForeground as any} />
                          <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
                            Log Manual Summit
                          </Text>
                        </View>
                      </>
                    )}
                  </Pressable>
                </CardFrame>
              </>
            ) : (
              <>
                {/* No summits yet */}
                <CardFrame topo="corner" seed={`logs-empty:${peakId}`} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <BookOpen size={18} color={colors.mutedForeground as any} />
                    <Text className="text-foreground text-base font-semibold">Your Summit Journal</Text>
                  </View>
                  <Text className="text-muted-foreground text-sm mt-3">
                    You haven't summited this peak yet. Get out there!
                  </Text>
                </CardFrame>

                {/* Manual summit CTA */}
                <CardFrame topo="none" seed={`manual-summit-cta:${peakId}`} style={{ padding: 14 }}>
                  <Text className="text-muted-foreground text-sm text-center">
                    Already climbed this peak but it wasn't tracked?
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    <SecondaryCTA
                      label="Log Manual Summit"
                      onPress={() => {
                        // TODO: Open Manual Summit modal
                        console.log("Log manual summit for peak:", peakId);
                      }}
                      Icon={Plus}
                    />
                  </View>
                </CardFrame>
              </>
            )}
          </View>
        ) : null}
      </BottomSheetScrollView>
    </View>
  );
}
