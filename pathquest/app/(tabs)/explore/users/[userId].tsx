import React, { useEffect, useMemo, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import DetailSkeleton from "@/src/components/explore/DetailSkeleton";
import { Text } from "@/src/components/ui";
import { UserDetail } from "@/src/components/profile/UserDetail";
import { useUserProfile, useUserAllSummitedPeaks } from "@/src/hooks/useProfileData";
import { useAuthStore } from "@/src/lib/auth";
import { useMapStore } from "@/src/store/mapStore";

function getBoundsFromPeaks(peaks: Array<{ location_coords?: [number, number] | null }>) {
  const coords = peaks
    .map((p) => p.location_coords)
    .filter((c): c is [number, number] => Array.isArray(c) && c.length === 2);
  if (coords.length === 0) return null;
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ] as [[number, number], [number, number]];
}

export default function ExploreUserProfileRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = typeof params.userId === "string" ? params.userId : "";

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const isOwner = isAuthenticated && !!authUser?.id && authUser.id === userId;

  const profile = useUserProfile(userId);
  // Fetch ALL summited peaks for the map overlay (not paginated)
  const allUserPeaks = useUserAllSummitedPeaks(userId);

  // Map store - using new focus system
  const focusUser = useMapStore((s) => s.focusUser);
  const focusDiscovery = useMapStore((s) => s.focusDiscovery);
  const requestFitToBounds = useMapStore((s) => s.requestFitToBounds);

  const overlayPeaks = allUserPeaks.data ?? [];
  const bounds = useMemo(() => getBoundsFromPeaks(overlayPeaks), [overlayPeaks]);
  
  // Track if we've already fitted bounds (only fit once on initial load)
  const hasFittedBounds = useRef(false);

  // Set user focus when peaks are ready
  useEffect(() => {
    if (userId && overlayPeaks.length > 0) {
      focusUser(userId, overlayPeaks);
    }
  }, [userId, overlayPeaks, focusUser]);

  // Auto-fit peaks into the visible map area ONCE when peaks first load
  useEffect(() => {
    if (!bounds || hasFittedBounds.current) return;
    hasFittedBounds.current = true;
    requestFitToBounds(bounds, {
      paddingTop: insets.top + 12 + 56 + 16,
      paddingBottom: 360 + 60 + insets.bottom, // assume halfway sheet
      paddingLeft: 40,
      paddingRight: 40,
    });
  }, [bounds, insets.bottom, insets.top, requestFitToBounds]);

  const handlePeakPress = (peakId: string) => {
    router.push({
      pathname: "/explore/peak/[peakId]" as any,
      params: { peakId },
    });
  };

  const handleChallengePress = (challengeId: string) => {
    if (isOwner) {
      // If viewing your own profile, go to the public challenge page
      router.push({
        pathname: "/explore/challenge/[challengeId]" as any,
        params: { challengeId },
      });
    } else {
      // If viewing someone else's profile, show their progress on that challenge
      router.push({
        pathname: "/explore/users/[userId]/challenges/[challengeId]" as any,
        params: { userId, challengeId },
      });
    }
  };

  if (profile.isLoading && !profile.data) {
    return <DetailSkeleton type="peak" onBack={() => router.back()} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <UserDetail
        userId={userId}
        isOwner={isOwner}
        onPeakPress={handlePeakPress}
        onChallengePress={handleChallengePress}
        inBottomSheet
      />

      {/* Overlay dismiss controls (match our detail screens pattern) */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.75}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: `${colors.card}EE` as any,
            borderWidth: 1,
            borderColor: `${colors.border}88` as any,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={18} color={colors.foreground as any} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            focusDiscovery();
            router.navigate("/explore" as any);
          }}
          activeOpacity={0.75}
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: `${colors.card}EE` as any,
            borderWidth: 1,
            borderColor: `${colors.border}88` as any,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={colors.foreground as any} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
