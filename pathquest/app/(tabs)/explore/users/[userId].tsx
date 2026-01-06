import React, { useEffect, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Map as MapIcon, X, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import DetailSkeleton from "@/src/components/explore/DetailSkeleton";
import { SecondaryCTA, Text } from "@/src/components/ui";
import { UserDetail } from "@/src/components/profile/UserDetail";
import { useUserProfile, useUserAllSummitedPeaks } from "@/src/hooks/useProfileData";
import { useAuthStore } from "@/src/lib/auth";
import { useMapStore } from "@/src/store/mapStore";
import { useSheetStore } from "@/src/store/sheetStore";

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

  const setUserOverlayPeaks = useMapStore((s) => s.setUserOverlayPeaks);
  const requestFitToBounds = useMapStore((s) => s.requestFitToBounds);
  const clearPendingFitBounds = useMapStore((s) => s.clearPendingFitBounds);
  const sheetCollapse = useSheetStore((s) => s.collapse);
  const sheetSnapIndex = useSheetStore((s) => s.snapIndex);

  const overlayPeaks = allUserPeaks.data ?? [];
  const bounds = useMemo(() => getBoundsFromPeaks(overlayPeaks), [overlayPeaks]);

  useEffect(() => {
    // While this route is active, only show this user's peaks on the map.
    // NOTE: We do NOT clear on unmount - this allows navigating to peak details
    // while keeping the user's peaks visible. The overlay is cleared when
    // returning to discovery view (explore/index.tsx) or pressing X.
    if (overlayPeaks.length > 0) {
      setUserOverlayPeaks(overlayPeaks);
    }
  }, [overlayPeaks, setUserOverlayPeaks]);

  // Auto-fit peaks into the visible map area while the profile is open.
  // Padding is conservative (assumes sheet covers part of the map).
  useEffect(() => {
    if (!bounds) return;
    const bottomPadBySnap = sheetSnapIndex === 2 ? 560 : sheetSnapIndex === 1 ? 360 : 180;
    requestFitToBounds(bounds, {
      paddingTop: insets.top + 12 + 56 + 16,
      paddingBottom: bottomPadBySnap + 60 + insets.bottom,
      paddingLeft: 40,
      paddingRight: 40,
    });
  }, [bounds, insets.bottom, insets.top, requestFitToBounds, sheetSnapIndex]);

  const handleShowOnMap = () => {
    if (!bounds) return;

    // Collapse sheet so peaks are visible; then fit bounds with padding similar to challenge "Show on Map".
    sheetCollapse();

    requestFitToBounds(bounds, {
      paddingTop: insets.top + 12 + 56 + 16, // omnibar area
      paddingBottom: 80 + 60 + insets.bottom + 20, // collapsed sheet + tab bar
      paddingLeft: 40,
      paddingRight: 40,
    });
  };

  const handlePeakPress = (peakId: string) => {
    router.push({
      pathname: "/explore/peak/[peakId]" as any,
      params: { peakId },
    });
  };

  const handleChallengePress = (challengeId: string) => {
    router.push({
      pathname: "/explore/challenge/[challengeId]" as any,
      params: { challengeId },
    });
  };

  if (profile.isLoading && !profile.data) {
    return <DetailSkeleton type="peak" onBack={() => router.back()} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar inside sheet */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: `${colors.border}66` as any,
        }}
      >
        <Text className="text-foreground font-semibold">Profile</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SecondaryCTA label="Show on Map" onPress={handleShowOnMap} Icon={MapIcon as any} />
        </View>
      </View>

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
          onPress={() => router.navigate("/explore" as any)}
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


