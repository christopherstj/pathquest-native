import React from "react";
import { View } from "react-native";
import { BookOpen, Check, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import type { SummitType } from "@pathquest/shared/types";
import { CardFrame, PrimaryCTA, SecondaryCTA, Text } from "@/src/components/ui";
import { SummitCard } from "@/src/components/shared";
import type { SummitCardData } from "@/src/components/shared/SummitCard";
import { useTheme } from "@/src/theme";
import { useAddReportStore, useManualSummitStore } from "@/src/store";

export function PeakDetailYourLogsTab({
  peakId,
  peakName,
  peakCoords,
  peakElevation,
  peakState,
  isAuthenticated,
  ascentCount,
  yourAscents,
  hasUnreportedAscent,
  unreportedAscentsCount,
  onConnectStrava,
}: {
  peakId: string;
  peakName: string;
  peakCoords: [number, number] | null; // [lng, lat]
  peakElevation?: number;
  peakState?: string;
  isAuthenticated: boolean;
  ascentCount: number;
  yourAscents: any[];
  hasUnreportedAscent: boolean;
  unreportedAscentsCount: number;
  onConnectStrava: () => void;
}) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const openAddReportModal = useAddReportStore((s) => s.openModal);
  const openManualSummit = useManualSummitStore((s) => s.openManualSummit);

  // Helper to determine summit type
  const getSummitType = (activityId?: string | number | null): SummitType => {
    // activityId can be string or number from the API
    if (activityId === null || activityId === undefined) return 'manual';
    if (typeof activityId === 'number') return 'activity';
    if (typeof activityId === 'string' && activityId.trim() !== '') return 'activity';
    return 'manual';
  };

  // Open Add Report modal for an ascent
  const handleOpenAddReport = (ascent: any) => {
    openAddReportModal({
      ascentId: ascent.id,
      peakId,
      peakName,
      timestamp: ascent.timestamp,
      activityId: ascent.activity_id,
      summitType: getSummitType(ascent.activity_id),
      notes: ascent.notes,
      difficulty: ascent.difficulty,
      experienceRating: ascent.experience_rating,
      conditionTags: ascent.condition_tags,
      customTags: ascent.custom_condition_tags,
    });
  };

  // Your Logs tab uses "summited" (sky blue) accents.
  const accent = colors.summited as string;
  const iconChipBg = `${accent}${isDark ? "22" : "18"}`;
  const iconChipBorder = `${accent}${isDark ? "3A" : "2A"}`;
  const dividerOpacity = isDark ? 0.35 : 0.25;

  if (!isAuthenticated) {
    return (
      <View style={{ gap: 12 }}>
        <CardFrame topo="corner" seed={`logs-login:${peakId}`} style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: iconChipBg as any,
                borderWidth: 1,
                borderColor: iconChipBorder as any,
              }}
            >
              <BookOpen size={16} color={accent as any} />
            </View>
            <Text className="text-foreground text-base font-semibold">Your Summit Journal</Text>
          </View>
          <Text className="text-muted-foreground text-sm mt-3">Sign in to track your summits and add trip reports.</Text>
          <View style={{ marginTop: 12 }}>
            <PrimaryCTA label="Connect with Strava" onPress={onConnectStrava} />
          </View>
        </CardFrame>
      </View>
    );
  }

  if (yourAscents.length === 0) {
    return (
      <View style={{ gap: 12 }}>
        <CardFrame topo="corner" seed={`logs-empty:${peakId}`} style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: iconChipBg as any,
                borderWidth: 1,
                borderColor: iconChipBorder as any,
              }}
            >
              <BookOpen size={16} color={accent as any} />
            </View>
            <Text className="text-foreground text-base font-semibold">Your Summit Journal</Text>
          </View>
          <Text className="text-muted-foreground text-sm mt-3">No logged summits for this peak yet.</Text>
          <Text className="text-muted-foreground text-sm mt-2">Sync activities from Strava or log a manual summit below.</Text>
          <View style={{ marginTop: 12 }}>
            <SecondaryCTA
              label="Log Manual Summit"
              onPress={() => {
                if (peakCoords) {
                  openManualSummit({
                    peakId,
                    peakName,
                    peakCoords,
                    peakElevation,
                    peakState,
                  });
                }
              }}
              Icon={Plus}
              disabled={!peakCoords}
            />
          </View>
        </CardFrame>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Summit count header */}
      <CardFrame topo="corner" seed={`your-summit-count:${peakId}`}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: iconChipBg as any,
                borderWidth: 1,
                borderColor: iconChipBorder as any,
              }}
            >
              <Check size={16} color={colors.summited as any} />
            </View>
            <Text className="text-foreground text-base font-semibold">
              You've summited this peak {ascentCount} {ascentCount === 1 ? "time" : "times"}
            </Text>
          </View>
          {hasUnreportedAscent ? (
            <Text className="text-muted-foreground text-xs mt-2">
              {unreportedAscentsCount} {unreportedAscentsCount === 1 ? "summit" : "summits"} without a trip report
            </Text>
          ) : (
            <Text className="text-primary text-xs mt-2">All summits have trip reports!</Text>
          )}
        </View>

        {/* Warm accent divider */}
        <View
          pointerEvents="none"
          style={{
            height: 2,
            backgroundColor: accent as any,
            opacity: dividerOpacity,
          }}
        />
      </CardFrame>

      {/* Ascent cards using SummitCard */}
      <View style={{ gap: 10 }}>
        {yourAscents.map((a, index) => {
          const summitData: SummitCardData = {
            id: a.id,
            timestamp: a.timestamp,
            notes: a.notes,
            difficulty: a.difficulty,
            experienceRating: a.experience_rating,
            conditionTags: a.condition_tags,
            customTags: a.custom_condition_tags,
            temperature: a.temperature,
            cloudCover: a.cloud_cover,
            precipitation: a.precipitation,
            weatherCode: a.weather_code,
            windSpeed: a.wind_speed,
          };

          return (
            <SummitCard
              key={a.id}
              summit={summitData}
              showPeakInfo={false}
              accentColor={colors.summited}
              isOwned={true}
              summitType={getSummitType(a.activity_id)}
              activityId={a.activity_id}
              onPress={() => {
                if (a.activity_id) {
                  router.push({
                    pathname: "/explore/activity/[activityId]",
                    params: { activityId: a.activity_id },
                  });
                }
              }}
              onAddNotes={() => handleOpenAddReport(a)}
              onEdit={() => handleOpenAddReport(a)}
              delay={index * 80}
              animated={true}
            />
          );
        })}
      </View>

      {/* Manual summit CTA */}
      <CardFrame topo="none" seed={`manual-summit-cta:${peakId}`} style={{ padding: 14 }}>
        <Text className="text-muted-foreground text-sm text-center">Climbed this peak without Strava?</Text>
        <View style={{ marginTop: 10 }}>
          <SecondaryCTA
            label="Log Manual Summit"
            onPress={() => {
              if (peakCoords) {
                openManualSummit({
                  peakId,
                  peakName,
                  peakCoords,
                  peakElevation,
                  peakState,
                });
              }
            }}
            Icon={Plus}
            disabled={!peakCoords}
          />
        </View>
      </CardFrame>
    </View>
  );
}


