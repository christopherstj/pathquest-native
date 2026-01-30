import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { ChevronLeft, X } from "lucide-react-native";
import type { Activity, ProfileStats, SummitWithPeak } from "@pathquest/shared";

import { useTheme } from "@/src/theme";

import ActivityDetailHero from "./ActivityDetailHero";
import ActivityWeatherCard from "./ActivityWeatherCard";
import ElevationProfile from "./ElevationProfile";
import ActivitySummitsList from "./ActivitySummitsList";
import ActivityUnconfirmedSummits from "./ActivityUnconfirmedSummits";
// import ActivityAchievementsCard from "./ActivityAchievementsCard";

interface ActivityDetailProps {
  activity: Activity;
  summits: SummitWithPeak[];
  /** Optional: user profile stats, used for achievements (e.g., highest peak) */
  profileStats?: ProfileStats;
  onClose?: () => void;
  onDismiss?: () => void;
  /** Called when user wants to add a summit report */
  onAddReport?: (summitId: string, peakId: string) => void;
  /** Called when user wants to edit an existing report */
  onEditReport?: (summitId: string, peakId: string) => void;
}

export default function ActivityDetail({
  activity,
  summits,
  profileStats,
  onClose,
  onDismiss,
  onAddReport,
  onEditReport,
}: ActivityDetailProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const hasSummits = (summits ?? []).length > 0;
  const accent = (hasSummits ? colors.summited : colors.primary) as string;

  const profileAccent = useMemo(() => accent, [accent]);
  
  const handleViewPeak = (peakId: string) => {
    router.push({
      pathname: "/explore/peak/[peakId]",
      params: { peakId },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header controls */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
          }}
        >
          <ChevronLeft size={20} color={colors.mutedForeground as any} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
          }}
        >
          <X size={18} color={colors.mutedForeground as any} />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 28, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <ActivityDetailHero activity={activity} summits={summits} />

        <ElevationProfile
          vertProfile={activity.vert_profile}
          distanceStream={activity.distance_stream}
          timeStream={activity.time_stream}
          activityStartTime={activity.start_time}
          summits={summits}
          accentColor={profileAccent}
        />

        {/* Achievements (disabled for now) */}
        {/* <ActivityAchievementsCard activity={activity} summits={summits} profileStats={profileStats} /> */}

        {/* Unconfirmed summits needing review */}
        <ActivityUnconfirmedSummits 
          activityId={activity.id}
          onViewPeak={handleViewPeak}
        />

        <ActivitySummitsList
          activityId={activity.id}
          summits={summits}
          onAddReport={onAddReport}
          onEditReport={onEditReport}
        />

        <ActivityWeatherCard
          activityId={activity.id}
          startTime={activity.start_time}
          startCoords={activity.start_coords}
        />
      </BottomSheetScrollView>
    </View>
  );
}


