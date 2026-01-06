import React from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { useUserChallengeProgress } from "@/src/hooks/useUserChallengeProgress";
import { UserChallengeProgressDetail } from "@/src/components/profile/UserChallengeProgressDetail";

export default function UserChallengeProgressRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ userId?: string; challengeId?: string }>();

  const userId = typeof params.userId === "string" ? params.userId : null;
  const challengeId = typeof params.challengeId === "string" ? params.challengeId : null;

  const progress = useUserChallengeProgress(userId, challengeId);

  if (!userId || !challengeId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: insets.top, padding: 16 }}>
        <Text className="text-foreground">Missing user or challenge.</Text>
      </View>
    );
  }

  if (progress.isLoading && !progress.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: insets.top, padding: 16 }}>
        <Text className="text-muted-foreground">Loading progress…</Text>
      </View>
    );
  }

  if (!progress.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: insets.top, padding: 16 }}>
        <Text className="text-muted-foreground">Unable to load this progress.</Text>
      </View>
    );
  }

  const { user, challenge, progress: p, peaks } = progress.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: insets.top }}>
      <UserChallengeProgressDetail
        userName={user.name}
        userPic={user.pic ?? null}
        challengeName={challenge.name ?? "Challenge"}
        total={p.total}
        completed={p.completed}
        peaks={peaks}
        onBack={() => router.back()}
        onViewChallenge={() =>
          router.push({
            pathname: "/explore/challenge/[challengeId]" as any,
            params: { challengeId },
          })
        }
        onPeakPress={(peakId) =>
          router.push({
            pathname: "/explore/peak/[peakId]" as any,
            params: { peakId },
          })
        }
        onUserPress={() =>
          router.push({
            pathname: "/users/[userId]" as any,
            params: { userId },
          })
        }
      />
    </View>
  );
}


