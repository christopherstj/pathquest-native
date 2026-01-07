/**
 * ActivitySummitsList
 *
 * Displays peaks summited during an activity using the SummitCard component.
 */

import React, { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { SummitWithPeak } from "@pathquest/shared";

import { CardFrame, Text } from "@/src/components/ui";
import { SummitCard, type SummitCardData } from "@/src/components/shared";
import { useTheme } from "@/src/theme";

/**
 * Transform SummitWithPeak to SummitCardData format
 */
function toSummitCardData(summit: SummitWithPeak): SummitCardData {
  return {
    id: summit.id,
    timestamp: summit.timestamp,
    peakName: summit.peak.name,
    peakId: summit.peak.id,
    elevation: summit.peak.elevation,
    notes: summit.notes,
    difficulty: summit.difficulty as SummitCardData["difficulty"],
    experienceRating: summit.experience_rating as SummitCardData["experienceRating"],
    conditionTags: summit.condition_tags,
    customTags: summit.custom_condition_tags,
    temperature: summit.temperature,
    cloudCover: summit.cloud_cover,
    precipitation: summit.precipitation,
    weatherCode: summit.weather_code,
    windSpeed: summit.wind_speed,
  };
}

interface ActivitySummitsListProps {
  activityId: string;
  summits: SummitWithPeak[];
  /** Called when user wants to add/edit a summit report */
  onAddReport?: (summitId: string, peakId: string) => void;
  /** Called when user wants to edit an existing report */
  onEditReport?: (summitId: string, peakId: string) => void;
}

export default function ActivitySummitsList({
  activityId,
  summits,
  onAddReport,
  onEditReport,
}: ActivitySummitsListProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const summitCards = useMemo(() => {
    return (summits ?? []).map((s) => toSummitCardData(s));
  }, [summits]);

  // Check if a summit has report data (notes, difficulty, rating, or tags)
  const hasReportData = (summit: SummitCardData) => {
    return !!(
      summit.notes?.trim() ||
      summit.difficulty ||
      summit.experienceRating ||
      (summit.conditionTags && summit.conditionTags.length > 0) ||
      (summit.customTags && summit.customTags.length > 0)
    );
  };

  if (!summits || summits.length === 0) {
    return (
      <CardFrame topo="corner" seed={`activity-summits-empty:${activityId}`} style={{ padding: 14 }}>
        <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
          Peaks Summited
        </Text>
        <Text className="text-muted-foreground text-sm mt-2">No peaks linked to this activity.</Text>
      </CardFrame>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
          Peaks Summited
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground as any }}>
          {summits.length}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {summitCards.map((summitData, index) => (
          <SummitCard
            key={summitData.id}
            summit={summitData}
            showPeakInfo={true}
            accentColor={colors.summited as string}
            isOwned={true}
            onPress={() => {
              if (summitData.peakId) {
                router.push({
                  pathname: "/explore/peak/[peakId]",
                  params: { peakId: summitData.peakId },
                });
              }
            }}
            onAddNotes={
              onAddReport && summitData.peakId
                ? () => onAddReport(summitData.id, summitData.peakId!)
                : undefined
            }
            onEdit={
              onEditReport && summitData.peakId && hasReportData(summitData)
                ? () => onEditReport(summitData.id, summitData.peakId!)
                : undefined
            }
            delay={index * 60}
            animated={true}
          />
        ))}
      </View>
    </View>
  );
}
