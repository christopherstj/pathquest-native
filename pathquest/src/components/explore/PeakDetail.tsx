/**
 * PeakDetail (Phase 2)
 *
 * Orchestrator: fetches data and delegates UI to smaller subcomponents.
 * 
 * Layout:
 * - Hero (with public lands badge)
 * - Weather Section (always visible)
 * - TabSwitcher → [Community | Your Logs]
 */

import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, Linking, Platform } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import type { Peak } from "@pathquest/shared";
import { ChevronLeft, X } from "lucide-react-native";

import { TabSwitcher } from "@/src/components/shared";
import { useTheme } from "@/src/theme";
import { useAuthStore } from "@/src/lib/auth";
import { startStravaAuth } from "@/src/lib/auth/strava";
import { useGPSNavigation, usePeakActivity, usePeakDetails, usePeakForecast, usePeakPublicSummitsCursor, usePeakWeather } from "@/src/hooks";

import { PeakDetailHero } from "./PeakDetailHero";
import { PeakDetailChallenges } from "./PeakDetailChallenges";
import { WeatherSection } from "./WeatherSection";
import { PeakDetailCommunityTab } from "./PeakDetailCommunityTab";
import { PeakDetailYourLogsTab } from "./PeakDetailYourLogsTab";

type PeakDetailTab = "community" | "yourLogs";

interface PeakDetailProps {
  peak: Peak;
  onClose?: () => void;
  onDismiss?: () => void; // Go straight to discovery (X button)
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
}

export default function PeakDetail({ peak, onClose, onDismiss }: PeakDetailProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PeakDetailTab>("community");

  const peakId = peak.id;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
  const peakCoords = resolvedPeak.location_coords ?? null;

  const yourAscents = useMemo(() => {
    const ascents = resolvedPeak.ascents ?? [];
    return [...ascents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [resolvedPeak.ascents]);
  const ascentCount = yourAscents.length;

  const userSummits = resolvedPeak.summits ?? 0;
  const hasSummited = userSummits > 0 || ascentCount > 0;

  const unreportedAscents = useMemo(() => yourAscents.filter((a) => !a.notes?.trim()), [yourAscents]);
  const hasUnreportedAscent = unreportedAscents.length > 0;

  const accentColor = hasSummited ? (colors.summited as string) : (colors.primary as string);
  const accentForeground = hasSummited ? (colors.summitedForeground as string) : (colors.primaryForeground as string);
  const accentWash = `${accentColor}${isDark ? "18" : "12"}`;
  const accentBorder = `${accentColor}${isDark ? "55" : "3A"}`;

  const publicSummits = publicSummitsPages?.pages.flatMap((p) => p.summits) ?? [];
  const totalCount = publicSummitsPages?.pages?.[0]?.totalCount ?? null;

  const recentConditionTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    publicSummits.slice(0, 20).forEach((s) => {
      (s.condition_tags ?? []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) as [string, number][];
  }, [publicSummits]);

  const locationString = useMemo(() => {
    const parts = [resolvedPeak.county, resolvedPeak.state, resolvedPeak.country].filter(Boolean);
    return parts.join(", ");
  }, [resolvedPeak.county, resolvedPeak.country, resolvedPeak.state]);

  const { nav: gps } = useGPSNavigation({
    targetCoords: peakCoords ?? null,
    targetElevationMeters: typeof resolvedPeak.elevation === "number" ? resolvedPeak.elevation : null,
    intervalMs: 5000,
  });

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
      {/* Navigation buttons row */}
      {(onClose || onDismiss) ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
          {/* Back button */}
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
              <ChevronLeft size={20} color={colors.mutedForeground as any} />
            </TouchableOpacity>
          ) : <View style={{ width: 38 }} />}
          
          {/* Dismiss button (X) - go straight to discovery */}
          {onDismiss ? (
            <TouchableOpacity
              onPress={onDismiss}
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
          ) : <View style={{ width: 38 }} />}
        </View>
      ) : null}

      {/* Content */}
      <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: onClose ? 8 : 16, paddingBottom: 28 }}>
        <PeakDetailHero
          peakId={peakId}
          peak={resolvedPeak}
          locationString={locationString}
          activity={activity}
          publicLand={resolvedPeak.publicLand}
          accentColor={accentColor}
          accentForeground={accentForeground}
          accentWash={accentWash}
          accentBorder={accentBorder}
          hasSummited={hasSummited}
          isAuthenticated={isAuthenticated}
          hasUnreportedAscent={hasUnreportedAscent}
          onOpenCompass={handleOpenCompass}
          onNavigate={handleNavigate}
          onOpenYourLogs={() => setActiveTab("yourLogs")}
          gps={gps}
        />

        {/* Challenges Section */}
        <PeakDetailChallenges 
          challenges={peakDetails?.challenges}
          isLoading={peakLoading}
        />

        {/* Weather Section - Always Visible */}
        <View style={{ marginTop: 16 }}>
          <WeatherSection
            peakId={peakId}
            weather={weather}
            weatherLoading={weatherLoading}
            forecast={forecast}
            forecastLoading={forecastLoading}
            recentConditionTags={recentConditionTags}
          />
        </View>

        <TabSwitcher
          tabs={[
            { id: "community", label: "Community" },
            { id: "yourLogs", label: "Your Logs" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginTop: 16, marginBottom: 12 }}
        />

        {activeTab === "community" ? (
          <PeakDetailCommunityTab
            peakId={peakId}
            activity={activity}
            publicSummits={publicSummits}
            publicSummitsLoading={publicSummitsLoading}
            totalCount={totalCount}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        ) : null}

        {activeTab === "yourLogs" ? (
          <PeakDetailYourLogsTab
            peakId={peakId}
            isAuthenticated={isAuthenticated}
            ascentCount={ascentCount}
            yourAscents={yourAscents}
            hasUnreportedAscent={hasUnreportedAscent}
            unreportedAscentsCount={unreportedAscents.length}
            onConnectStrava={() => startStravaAuth()}
          />
        ) : null}
      </BottomSheetScrollView>
    </View>
  );
}


