import React, { useMemo } from "react";
import { View } from "react-native";
import { Flag, MapPin } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import { CardFrame, Text } from "@/src/components/ui";
import { UserAvatar } from "@/src/components/shared";
import { ProfileContent } from "@/src/components/profile";
import { useUserJournal, useUserProfile } from "@/src/hooks/useProfileData";
import { formatDate } from "@/src/utils/formatting";

export function UserDetail({
  userId,
  isOwner,
  onPeakPress,
  onChallengePress,
  inBottomSheet = false,
}: {
  userId: string;
  isOwner: boolean;
  onPeakPress: (peakId: string) => void;
  onChallengePress: (challengeId: string) => void;
  /** When true, use BottomSheetScrollView in child components */
  inBottomSheet?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const profile = useUserProfile(userId);
  const lastSummit = useUserJournal(userId, 1, 1);

  const headerUser = profile.data?.user ?? null;
  const locationText = useMemo(() => {
    const parts = [headerUser?.city, headerUser?.state, headerUser?.country].filter(Boolean);
    return parts.join(", ");
  }, [headerUser?.city, headerUser?.country, headerUser?.state]);

  const heroBg = isDark ? "rgba(91, 145, 103, 0.12)" : "rgba(77, 122, 87, 0.10)";
  const heroBorder = `${colors.primary}${isDark ? "3A" : "2A"}`;

  const lastEntry = lastSummit.data?.entries?.[0] ?? null;
  const lastSummitLabel = lastEntry
    ? `${lastEntry.peakName} · ${formatDate(lastEntry.timestamp)}`
    : "No public summits yet";

  return (
    <View style={{ flex: 1 }}>
      <CardFrame variant="hero" topo="full" ridge="bottom" seed={`user:${userId}`} accentColor={colors.primary as any}>
        <View style={{ padding: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <UserAvatar size="lg" name={headerUser?.name} uri={headerUser?.pic} />
            <View style={{ flex: 1 }}>
              <Text className="text-foreground text-lg font-semibold" numberOfLines={1}>
                {headerUser?.name ?? "Explorer"}
              </Text>
              {locationText ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <MapPin size={14} color={colors.mutedForeground as any} />
                  <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                    {locationText}
                  </Text>
                </View>
              ) : (
                <Text className="text-muted-foreground text-xs mt-0.5">Public profile</Text>
              )}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: heroBg as any,
              borderWidth: 1,
              borderColor: heroBorder as any,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.summited}${isDark ? "22" : "18"}` as any,
                borderWidth: 1,
                borderColor: `${colors.summited}${isDark ? "3A" : "2A"}` as any,
              }}
            >
              <Flag size={16} color={colors.summited as any} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-muted-foreground text-[10px] uppercase tracking-widest">
                Last summit
              </Text>
              <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                {lastSummit.isLoading ? "Loading…" : lastSummitLabel}
              </Text>
            </View>
          </View>
        </View>
      </CardFrame>

      <View style={{ flex: 1 }}>
        <ProfileContent
          userId={userId}
          isOwner={isOwner}
          onPeakPress={onPeakPress}
          onChallengePress={onChallengePress}
          inBottomSheet={inBottomSheet}
        />
      </View>
    </View>
  );
}


