import React, { useMemo } from "react";
import { View } from "react-native";
import { Mountain, TrendingUp, Crown } from "lucide-react-native";
import type { Activity, ProfileStats, SummitWithPeak } from "@pathquest/shared";

import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { metersToFeet } from "@/src/utils/geo";

type Achievement = {
  id: "multi_peak" | "big_gain" | "highest_peak";
  title: string;
  detail?: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

function AchievementBadge({
  title,
  value,
  Icon,
  color,
}: {
  title: string;
  value: string;
  Icon: Achievement["Icon"];
  color: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1, minWidth: 96 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          backgroundColor: `${color}15`,
          borderWidth: 2,
          borderColor: `${color}40`,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${color}25`,
            borderWidth: 1,
            borderColor: `${color}30`,
          }}
        >
          <Icon size={20} color={color} />
        </View>
      </View>

      <Text style={{ color: colors.foreground as any, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
        {value}
      </Text>
      <Text
        style={{
          color: colors.mutedForeground as any,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginTop: 2,
          textAlign: "center",
          maxWidth: 96,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      {isDark ? null : null}
    </View>
  );
}

export default function ActivityAchievementsCard({
  activity,
  summits,
  profileStats,
}: {
  activity: Activity;
  summits: SummitWithPeak[];
  profileStats?: ProfileStats;
}) {
  const { colors } = useTheme();

  const achievements = useMemo((): Array<Achievement & { value: string }> => {
    const out: Array<Achievement & { value: string }> = [];

    // Multi-peak day (2+ peaks)
    if ((summits ?? []).length >= 2) {
      out.push({
        id: "multi_peak",
        title: "Multi-peak day",
        value: `${summits.length}`,
        Icon: Mountain,
      });
    }

    // Big elevation day (>= 3000 ft gain)
    const gainM =
      typeof activity.gain === "number"
        ? activity.gain
        : typeof activity.gain === "string"
          ? Number.parseFloat(activity.gain)
          : undefined;
    const gainFt = gainM != null ? metersToFeet(gainM) : null;
    if (gainFt != null && gainFt >= 3000) {
      out.push({
        id: "big_gain",
        title: "Big elevation day",
        value: `+${Math.round(gainFt).toLocaleString()}ft`,
        Icon: TrendingUp,
      });
    }

    // Personal record: highest peak (best-effort)
    const highest = profileStats?.highestPeak ?? null;
    if (highest && (summits ?? []).some((s) => s.peak.id === highest.id)) {
      out.push({
        id: "highest_peak",
        title: "Personal record",
        value: `${Math.round(metersToFeet(highest.elevation)).toLocaleString()}ft`,
        Icon: Crown,
      });
    }

    return out;
  }, [activity.gain, profileStats?.highestPeak, summits]);

  if (achievements.length === 0) return null;

  return (
    <CardFrame topo="corner" seed="activity-achievements" style={{ padding: 14 }}>
      <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
        Achievements
      </Text>

      <View
        style={{
          marginTop: 10,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        {achievements.map((a) => (
          <AchievementBadge
            key={a.id}
            title={a.title}
            value={a.value}
            Icon={a.Icon}
            color={colors.summited as string}
          />
        ))}
      </View>
    </CardFrame>
  );
}


