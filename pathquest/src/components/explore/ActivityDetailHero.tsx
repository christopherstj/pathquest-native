import React, { useMemo } from "react";
import { View } from "react-native";
import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import type { Activity, SummitWithPeak } from "@pathquest/shared";
import { metersToFeet, metersToMiles } from "@/src/utils/geo";
import { formatDateTime } from "@/src/utils/formatting";

function formatDuration(seconds: number | null) {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return "—";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function formatPace(seconds: number | null, miles: number | null) {
  if (!seconds || !miles || !isFinite(seconds) || !isFinite(miles) || miles <= 0) return "—";
  const pace = seconds / miles; // sec/mi
  const mm = Math.floor(pace / 60);
  const ss = Math.round(pace % 60);
  return `${mm}:${String(ss).padStart(2, "0")}/mi`;
}

export default function ActivityDetailHero({
  activity,
  summits,
}: {
  activity: Activity;
  summits: SummitWithPeak[];
}) {
  const { colors, isDark } = useTheme();

  // DEBUG: log activity stats to verify API is returning them
  console.log("[ActivityDetailHero] activity.distance:", activity.distance, "type:", typeof activity.distance);
  console.log("[ActivityDetailHero] activity.gain:", activity.gain, "type:", typeof activity.gain);
  console.log("[ActivityDetailHero] activity.time_stream:", activity.time_stream?.length, "last:", activity.time_stream?.[activity.time_stream?.length - 1]);

  const hasSummits = (summits ?? []).length > 0;
  const accent = (hasSummits ? colors.summited : colors.primary) as string;
  const accentWash = `${accent}${isDark ? "18" : "12"}`;
  const accentBorder = `${accent}${isDark ? "55" : "3A"}`;

  // Parse distance - handle both number and string (JSON may return string)
  const miles = useMemo(() => {
    const d = activity.distance;
    const num = typeof d === "number" ? d : typeof d === "string" ? parseFloat(d) : NaN;
    return !isNaN(num) && num > 0 ? metersToMiles(num) : null;
  }, [activity.distance]);

  // Parse gain - handle both number and string
  const gainFeet = useMemo(() => {
    const g = activity.gain;
    const num = typeof g === "number" ? g : typeof g === "string" ? parseFloat(g) : NaN;
    return !isNaN(num) ? metersToFeet(num) : null;
  }, [activity.gain]);

  // Get duration from time_stream (last element is total elapsed seconds)
  const durationSec = useMemo(() => {
    const t = activity.time_stream;
    if (!Array.isArray(t) || t.length === 0) return null;
    const last = t[t.length - 1];
    const num = typeof last === "number" ? last : typeof last === "string" ? parseFloat(last) : NaN;
    return !isNaN(num) && num > 0 ? num : null;
  }, [activity.time_stream]);

  const sport = activity.sport ? String(activity.sport) : "Activity";
  const title = activity.title?.trim() ? activity.title.trim() : "Untitled Activity";

  return (
    <CardFrame
      topo="full"
      ridge="bottom"
      seed={`activity-hero:${activity.id}`}
      style={{
        padding: 16,
        backgroundColor: accentWash as any,
        borderColor: accentBorder as any,
        borderWidth: 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
            {sport}
          </Text>
          <Text className="text-foreground text-xl font-semibold mt-1">{title}</Text>
          <Text className="text-muted-foreground text-sm mt-1">
            {formatDateTime(activity.start_time, activity.timezone)}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: `${accent}${isDark ? "22" : "18"}` as any,
            borderWidth: 1,
            borderColor: `${accent}${isDark ? "3A" : "2A"}` as any,
          }}
        >
          <Text className="text-xs font-semibold" style={{ color: accent as any }}>
            {hasSummits ? `${summits.length} summits` : "no summits"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
            Distance
          </Text>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground as any }}>
            {miles == null ? "—" : `${miles.toFixed(2)} mi`}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
            Gain
          </Text>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground as any }}>
            {gainFeet == null ? "—" : `${Math.round(gainFeet).toLocaleString()} ft`}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
            Duration
          </Text>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground as any }}>
            {formatDuration(durationSec)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
            Avg pace
          </Text>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground as any }}>
            {formatPace(durationSec, miles)}
          </Text>
        </View>
      </View>
    </CardFrame>
  );
}


