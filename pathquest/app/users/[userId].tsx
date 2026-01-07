import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, X } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import { Text } from "@/src/components/ui";
import { UserDetail } from "@/src/components/profile/UserDetail";
import { useAuthStore } from "@/src/lib/auth";

export default function UserDetailRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = typeof params.userId === "string" ? params.userId : "";

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isOwner = isAuthenticated && !!authUser?.id && authUser.id === userId;

  const handlePeakPress = (peakId: string) => {
    router.push({
      pathname: "/explore/peak/[peakId]" as any,
      params: { peakId },
    });
  };

  const handleChallengePress = (challengeId: string) => {
    router.push({
      // Full-screen profile: deep link to user-specific progress detail
      pathname: "/users/[userId]/challenges/[challengeId]" as any,
      params: { userId, challengeId },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background as any, paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: `${colors.border}80` as any,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 6 }}>
          <ChevronLeft size={20} color={colors.foreground as any} />
        </TouchableOpacity>
        <Text className="text-foreground font-semibold">Profile</Text>
        <TouchableOpacity
          onPress={() => router.navigate("/explore" as any)}
          activeOpacity={0.7}
          style={{ padding: 6 }}
        >
          <X size={18} color={colors.mutedForeground as any} />
        </TouchableOpacity>
      </View>

      <UserDetail
        userId={userId}
        isOwner={isOwner}
        onPeakPress={handlePeakPress}
        onChallengePress={handleChallengePress}
      />
    </View>
  );
}


