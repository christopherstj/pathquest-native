import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { ChevronLeft, Trophy } from "lucide-react-native";
import { CardFrame, SecondaryCTA, Text, Value } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { UserAvatar } from "@/src/components/shared";
import PeakRow from "@/src/components/explore/PeakRow";
import { haversineMeters } from "@/src/utils/geo";
import type { Peak } from "@pathquest/shared";

type Coords = { lat: number; lng: number };

export function UserChallengeProgressDetail({
  userName,
  userPic,
  challengeName,
  total,
  completed,
  peaks,
  onBack,
  onViewChallenge,
  onPeakPress,
  onUserPress,
}: {
  userName: string;
  userPic?: string | null;
  challengeName: string;
  total: number;
  completed: number;
  peaks: Array<Peak & { is_summited: boolean; summit_date: string | null; summits: number }>;
  onBack: () => void;
  onViewChallenge: () => void;
  onPeakPress: (peakId: string) => void;
  onUserPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loc = await Mapbox.locationManager.getLastKnownLocation();
        const c = loc?.coords;
        if (!cancelled && c?.latitude && c?.longitude) {
          setCoords({ lat: c.latitude, lng: c.longitude });
        }
      } catch {
        // ok
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { summited, remaining } = useMemo(() => {
    const s = peaks.filter((p) => p.is_summited);
    const r = peaks.filter((p) => !p.is_summited);
    const sortRemaining = [...r].sort((a, b) => {
      if (!coords) return (b.elevation ?? 0) - (a.elevation ?? 0);
      if (!a.location_coords || !b.location_coords) return 0;
      const da = haversineMeters(coords, { lat: a.location_coords[1], lng: a.location_coords[0] });
      const db = haversineMeters(coords, { lat: b.location_coords[1], lng: b.location_coords[0] });
      return da - db;
    });
    return { summited: s, remaining: sortRemaining };
  }, [coords, peaks]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={{ padding: 6, marginLeft: -6 }}>
          <ChevronLeft size={20} color={colors.foreground as any} />
        </TouchableOpacity>
        <Text className="text-foreground font-semibold">Challenge Progress</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Hero */}
      <CardFrame variant="hero" topo="full" ridge="bottom" seed={`user-challenge:${challengeName}`} accentColor={colors.secondary as any}>
        <View style={{ padding: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <UserAvatar size="md" name={userName} uri={userPic ?? null} onPress={onUserPress} />
            <View style={{ flex: 1 }}>
              <Text className="text-foreground text-xs" style={{ color: colors.mutedForeground as any }}>
                {userName}
              </Text>
              <Text className="text-foreground text-base font-semibold" numberOfLines={2}>
                {challengeName}
              </Text>
            </View>
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.secondary}${isDark ? "22" : "18"}` as any,
                borderWidth: 1,
                borderColor: `${colors.secondary}${isDark ? "44" : "33"}` as any,
              }}
            >
              <Trophy size={18} color={colors.secondary as any} />
              <Value className="text-foreground text-lg font-bold" style={{ marginTop: 2 }}>
                {pct}%
              </Value>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Value className="text-foreground text-lg font-bold">{completed}</Value>
              <Text className="text-muted-foreground text-[10px]">completed</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Value className="text-foreground text-lg font-bold">{total}</Value>
              <Text className="text-muted-foreground text-[10px]">total</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Value className="text-foreground text-lg font-bold">{Math.max(0, total - completed)}</Value>
              <Text className="text-muted-foreground text-[10px]">remaining</Text>
            </View>
          </View>

          <SecondaryCTA label="View Challenge" onPress={onViewChallenge} Icon={Trophy as any} />
        </View>
      </CardFrame>

      {/* Remaining */}
      <View style={{ marginTop: 14, marginBottom: 6 }}>
        <Text className="text-foreground text-sm font-semibold">Remaining</Text>
        <Text className="text-muted-foreground text-xs">
          {coords ? "Sorted by distance from you" : "Sorted by elevation"}
        </Text>
      </View>
      <View style={{ marginHorizontal: -16 }}>
        {remaining.map((p) => (
          <PeakRow key={`remaining:${p.id}`} peak={p} isSummited={false} onPress={() => onPeakPress(p.id)} />
        ))}
      </View>

      {/* Summited */}
      <View style={{ marginTop: 18, marginBottom: 6 }}>
        <Text className="text-foreground text-sm font-semibold">Summited</Text>
        <Text className="text-muted-foreground text-xs">
          {summited.length} peak{summited.length === 1 ? "" : "s"} completed
        </Text>
      </View>
      <View style={{ marginHorizontal: -16 }}>
        {summited.map((p) => (
          <PeakRow key={`summited:${p.id}`} peak={p} isSummited={true} onPress={() => onPeakPress(p.id)} />
        ))}
      </View>
    </ScrollView>
  );
}


