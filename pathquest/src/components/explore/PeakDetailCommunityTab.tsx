import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Activity, Users, LogIn, FileText } from "lucide-react-native";
import type { PeakActivity } from "@pathquest/shared";
import { CardFrame, SecondaryCTA, Text, Value } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { SummitCard } from "@/src/components/shared";
import { PeakPhotosGallery } from "./PeakPhotosGallery";
import { useAuthStore } from "@/src/lib/auth";
import { useLoginPromptStore } from "@/src/store";

export function PeakDetailCommunityTab({
  peakId,
  activity,
  publicSummits,
  publicSummitsLoading,
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  peakId: string;
  activity: PeakActivity | undefined;
  publicSummits: any[];
  publicSummitsLoading: boolean;
  totalCount?: number | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showLoginPrompt = useLoginPromptStore((s) => s.showPrompt);

  // Community tab uses "primary" (forest green) accents.
  const accent = colors.primary as string;
  const iconChipBg = `${accent}${isDark ? "22" : "18"}`;
  const iconChipBorder = `${accent}${isDark ? "3A" : "2A"}`;
  const dividerOpacity = isDark ? 0.35 : 0.25;

  return (
    <View style={{ gap: 12 }}>
      {/* Photos Gallery */}
      <PeakPhotosGallery peakId={peakId} limit={12} />

      {/* Activity summary header */}
      {activity ? (
        <CardFrame topo="corner" seed={`community-activity:${peakId}`}>
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
                  <Activity size={16} color={accent as any} />
                </View>
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
              {totalCount ? (
                <View style={{ alignItems: "center" }}>
                  <Value className="text-foreground text-lg font-bold">{totalCount}</Value>
                  <Text className="text-muted-foreground text-[10px]">all time</Text>
                </View>
              ) : null}
            </View>
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
      ) : null}

      {/* Public summits header */}
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
          <Users size={16} color={accent as any} />
        </View>
        <Text className="text-foreground text-base font-semibold">Recent Reports</Text>
      </View>

      {publicSummitsLoading ? (
        <Text className="text-muted-foreground text-sm">Loading community…</Text>
      ) : publicSummits.length > 0 ? (
        <View style={{ gap: 10 }}>
          {publicSummits.map((s, index) => (
            <SummitCard 
              key={s.id} 
              summit={{
                id: s.id,
                timestamp: s.timestamp,
                notes: s.notes,
                difficulty: s.difficulty,
                experienceRating: s.experience_rating,
                conditionTags: s.condition_tags,
                customTags: s.custom_condition_tags,
                temperature: s.temperature,
                cloudCover: s.cloud_cover,
                precipitation: s.precipitation,
                weatherCode: s.weather_code,
                windSpeed: s.wind_speed,
                summiterName: s.user_name,
                summiterId: s.user_id,
              }}
              showPeakInfo={false}
              accentColor={accent}
              delay={index * 60}
              animated={true}
              onSummiterPress={
                s.user_id
                  ? () =>
                      router.push({
                        // Keep the user in Explore: open user profile inside the bottom sheet.
                        pathname: "/explore/users/[userId]" as any,
                        params: { userId: s.user_id },
                      })
                  : undefined
              }
            />
          ))}

          {hasNextPage ? (
            <View style={{ marginTop: 4 }}>
              <SecondaryCTA label={isFetchingNextPage ? "Loading…" : "Load more"} onPress={onLoadMore} disabled={isFetchingNextPage} />
            </View>
          ) : null}
        </View>
      ) : (
        <CardFrame topo="none" seed={`community-empty:${peakId}`} style={{ padding: 14 }}>
          <Text className="text-muted-foreground text-sm">No public summits yet. Be the first!</Text>
        </CardFrame>
      )}

      {/* Inline CTA for guests */}
      {!isAuthenticated && publicSummits.length > 0 && (
        <TouchableOpacity
          onPress={() => showLoginPrompt('add_report')}
          activeOpacity={0.7}
        >
          <CardFrame topo="none" seed={`community-guest-cta:${peakId}`} style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colors.secondary}20` as any,
                  borderWidth: 1,
                  borderColor: `${colors.secondary}30` as any,
                }}
              >
                <FileText size={18} color={colors.secondary as any} />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground text-sm font-medium">
                  Climbed this peak?
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Sign in to add your trip report
                </Text>
              </View>
              <LogIn size={16} color={colors.mutedForeground as any} />
            </View>
          </CardFrame>
        </TouchableOpacity>
      )}
    </View>
  );
}


