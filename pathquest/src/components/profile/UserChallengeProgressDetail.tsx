import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, TouchableOpacity, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Award, ChevronLeft, Share2, Star, Target, Trophy } from "lucide-react-native";
import { CardFrame, PrimaryCTA, Text, Value } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { UserAvatar } from "@/src/components/shared";
import PeakRow from "@/src/components/explore/PeakRow";
import { haversineMeters } from "@/src/utils/geo";
import type { Peak } from "@pathquest/shared";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { TabSwitcher } from "@/src/components/shared";

type Coords = { lat: number; lng: number };
type TabId = "progress" | "peaks";
type PeaksFilter = "all" | "summited" | "remaining";

/**
 * MilestoneBadge - Circular achievement indicator like vintage trail markers
 * (Copied from ChallengeDetail to keep the exact vibe + animation)
 */
const MilestoneBadge: React.FC<{
  Icon: any;
  label: string;
  value: string | number;
  color: string;
  unlocked?: boolean;
  delay?: number;
}> = ({ Icon, label, value, color, unlocked = true, delay = 0 }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
      className="items-center"
    >
      <View
        className="w-14 h-14 rounded-full items-center justify-center mb-1.5"
        style={{
          backgroundColor: unlocked ? `${color}15` : colors.muted,
          borderWidth: 2,
          borderColor: unlocked ? `${color}40` : colors.border,
        }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: unlocked ? `${color}25` : "transparent",
            borderWidth: 1,
            borderColor: unlocked ? `${color}30` : "transparent",
          }}
        >
          <Icon size={18} color={unlocked ? color : colors.mutedForeground} strokeWidth={2} />
        </View>
      </View>
      <Text className="text-base font-semibold" style={{ color: unlocked ? colors.foreground : colors.mutedForeground }}>
        {value}
      </Text>
      <Text className="text-[9px] uppercase tracking-wider text-center mt-0.5" style={{ color: colors.mutedForeground }}>
        {label}
      </Text>
    </Animated.View>
  );
};

export function UserChallengeProgressDetail({
  userName,
  userPic,
  challengeName,
  total,
  completed,
  peaks,
  onBack,
  onShare,
  onViewMyProgress,
  onPeakPress,
  onUserPress,
  inBottomSheet = false,
}: {
  userName: string;
  userPic?: string | null;
  challengeName: string;
  total: number;
  completed: number;
  peaks: Array<Peak & { is_summited: boolean; summit_date: string | null; summits: number }>;
  onBack: () => void;
  onShare?: () => void;
  /** CTA shown when viewing another user's progress */
  onViewMyProgress?: () => void;
  onPeakPress: (peakId: string) => void;
  onUserPress: () => void;
  /** When true, use BottomSheetScrollView so scroll gestures work inside ContentSheet. */
  inBottomSheet?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("progress");
  const [filterMode, setFilterMode] = useState<PeaksFilter>("all");
  const ScrollContainer = inBottomSheet ? BottomSheetScrollView : ScrollView;

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
  const isCompleted = total > 0 && completed >= total;
  const accentColor = isCompleted ? (colors.summited as string) : (colors.secondary as string);
  const accentWash = `${accentColor}${isDark ? "18" : "12"}`;
  const accentBorder = `${accentColor}${isDark ? "55" : "3A"}`;

  const milestones = useMemo(() => {
    const thresholds = [10, 25, 50, total].filter((n, idx, arr) => n > 0 && n <= total && arr.indexOf(n) === idx);
    return thresholds.map((n) => ({
      value: n,
      label: n === total ? "Complete" : `${n} peaks`,
      unlocked: completed >= n,
      icon: n === total ? Star : Target,
    }));
  }, [total, completed]);

  const { summited, remaining, recentSummits } = useMemo(() => {
    const s = peaks.filter((p) => p.is_summited);
    const r = peaks.filter((p) => !p.is_summited);
    const sortRemaining = [...r].sort((a, b) => {
      if (!coords) return (b.elevation ?? 0) - (a.elevation ?? 0);
      if (!a.location_coords || !b.location_coords) return 0;
      const da = haversineMeters(coords, { lat: a.location_coords[1], lng: a.location_coords[0] });
      const db = haversineMeters(coords, { lat: b.location_coords[1], lng: b.location_coords[0] });
      return da - db;
    });
    const recent = [...s]
      .filter((p) => !!p.summit_date)
      .sort((a, b) => new Date(b.summit_date as string).getTime() - new Date(a.summit_date as string).getTime())
      .slice(0, 12);
    return { summited: s, remaining: sortRemaining, recentSummits: recent };
  }, [coords, peaks]);

  const allPeaksSorted = useMemo(() => {
    return [...peaks].sort((a, b) => (b.elevation ?? 0) - (a.elevation ?? 0));
  }, [peaks]);

  const peaksForList = useMemo(() => {
    const base =
      filterMode === "summited" ? summited : filterMode === "remaining" ? remaining : peaks;
    return [...base].sort((a, b) => (b.elevation ?? 0) - (a.elevation ?? 0));
  }, [filterMode, peaks, remaining, summited]);

  return (
    <ScrollContainer
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={{ padding: 6, marginLeft: -6 }}>
          <ChevronLeft size={20} color={colors.foreground as any} />
        </TouchableOpacity>
        <Text className="text-foreground font-semibold">Challenge</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Hero */}
      <CardFrame
        variant="hero"
        topo="full"
        ridge="bottom"
        seed={`user-challenge:${challengeName}`}
        accentColor={accentColor as any}
      >
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
                backgroundColor: accentWash as any,
                borderWidth: 1,
                borderColor: accentBorder as any,
              }}
            >
              <Trophy size={18} color={accentColor as any} />
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

          {/* Braggy CTA row */}
          {onShare ? (
            <PrimaryCTA
              label="Share my progress"
              onPress={onShare}
              Icon={Share2 as any}
              backgroundColor={accentColor}
              foregroundColor={colors.card as any}
            />
          ) : onViewMyProgress ? (
            <PrimaryCTA
              label="View my progress"
              onPress={onViewMyProgress}
              Icon={Trophy as any}
              backgroundColor={accentColor}
              foregroundColor={colors.card as any}
            />
          ) : null}

        </View>
      </CardFrame>

      <TabSwitcher
        tabs={[
          { id: "progress", label: "Progress" },
          { id: "peaks", label: "Peaks" },
        ]}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as TabId)}
        style={{ marginTop: 16, marginBottom: 12 }}
      />

      {activeTab === "progress" ? (
        <View style={{ gap: 16 }}>
          {/* Milestones (match personal challenge detail vibe) */}
          {milestones.length > 0 ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Award size={14} color={colors.mutedForeground as any} />
                <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
                  Milestones
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                {milestones.map((m, idx) => (
                  <MilestoneBadge
                    key={m.value}
                    Icon={m.icon}
                    label={m.label}
                    value={m.unlocked ? "✓" : `${m.value - completed}`}
                    color={m.value === total ? (colors.summited as any) : (colors.secondary as any)}
                    unlocked={m.unlocked}
                    delay={250 + idx * 90}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* All peaks list (summited peaks show PeakRow's blue medal/accent) */}
          <View>
            <View style={{ marginBottom: 8 }}>
              <Text className="text-foreground text-sm font-semibold">All peaks</Text>
              <Text className="text-muted-foreground text-xs">
                {completed} of {total} summited
              </Text>
            </View>
            <Text className="text-muted-foreground text-xs" style={{ marginBottom: 8 }}>
              Sorted by elevation
            </Text>
            <View style={{ marginHorizontal: -16 }}>
              {allPeaksSorted.map((p) => (
                <PeakRow key={`all:${p.id}`} peak={p} isSummited={p.is_summited} onPress={() => onPeakPress(p.id)} />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {activeTab === "peaks" ? (
        <View>
          {/* Filter pills (match challenge detail vibe) */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            {(
              [
                { id: "all" as const, label: `All (${peaks.length})` },
                { id: "summited" as const, label: `Summited (${summited.length})` },
                { id: "remaining" as const, label: `Remaining (${remaining.length})` },
              ] as const
            ).map((t) => {
              const active = filterMode === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => setFilterMode(t.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? `${accentColor}${isDark ? "66" : "55"}` : (colors.border as any),
                    backgroundColor: active ? `${accentColor}${isDark ? "18" : "12"}` : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[11px] font-semibold" style={{ color: active ? (accentColor as any) : (colors.mutedForeground as any) }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-muted-foreground text-xs" style={{ marginBottom: 8 }}>
            Sorted by elevation
          </Text>

          <View style={{ marginHorizontal: -16 }}>
            {peaksForList.map((p) => (
              <PeakRow key={`peak:${p.id}`} peak={p} isSummited={p.is_summited} onPress={() => onPeakPress(p.id)} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollContainer>
  );
}


