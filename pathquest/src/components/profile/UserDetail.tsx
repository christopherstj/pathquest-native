import React, { useMemo } from "react";
import { View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import { CardFrame, Text } from "@/src/components/ui";
import { UserAvatar } from "@/src/components/shared";
import { ProfileContent } from "@/src/components/profile";
import { useUserProfile } from "@/src/hooks/useProfileData";

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
  const { colors } = useTheme();
  const profile = useUserProfile(userId);

  const headerUser = profile.data?.user ?? null;
  const locationText = useMemo(() => {
    const parts = [headerUser?.city, headerUser?.state, headerUser?.country].filter(Boolean);
    return parts.join(", ");
  }, [headerUser?.city, headerUser?.country, headerUser?.state]);

  return (
    <View style={{ flex: 1, paddingTop: inBottomSheet ? 56 : 0 }}>
      <CardFrame 
        variant="hero" 
        topo="full" 
        ridge="bottom" 
        seed={`user:${userId}`} 
        accentColor={colors.primary as any}
      >
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
              ) : null}
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


