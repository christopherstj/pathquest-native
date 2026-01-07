import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Share, TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme";
import { Text } from "@/src/components/ui";
import { useUserChallengeProgress } from "@/src/hooks/useUserChallengeProgress";
import { UserChallengeProgressDetail } from "@/src/components/profile/UserChallengeProgressDetail";
import { useMapStore } from "@/src/store/mapStore";
import type { Peak } from "@pathquest/shared";
import { useAuthStore, startStravaAuth } from "@/src/lib/auth";

// Tab bar height (matches tabs layout)
const TAB_BAR_HEIGHT = 60;
// Collapsed sheet height
const COLLAPSED_SHEET_HEIGHT = 80;

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

export default function ExploreUserChallengeProgressRoute() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string; challengeId?: string }>();

  // Map store - using new focus system
  const focusChallenge = useMapStore((s) => s.focusChallenge);
  const focusDiscovery = useMapStore((s) => s.focusDiscovery);
  const requestFitToBounds = useMapStore((s) => s.requestFitToBounds);

  const userId = typeof params.userId === "string" ? params.userId : null;
  const challengeId = typeof params.challengeId === "string" ? params.challengeId : null;

  const progress = useUserChallengeProgress(userId, challengeId);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const viewerUserId = authUser?.id ?? null;
  const isOwner = !!viewerUserId && !!userId && viewerUserId === userId;

  // ═══════════════════════════════════════════════════════════════════════════
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY (before any early returns)
  // This avoids Rules of Hooks violations when the component re-renders with data
  // ═══════════════════════════════════════════════════════════════════════════

  // Derived data (safe defaults for loading state)
  const data = progress.data ?? null;
  const user = data?.user ?? { name: "", pic: null };
  const challenge = data?.challenge ?? { name: "" };
  const p = data?.progress ?? { completed: 0, total: 0 };
  const peaks = data?.peaks ?? [];
  const bounds = useMemo(() => getBoundsFromPeaks(peaks), [peaks]);

  // Track if we've already fitted bounds (only fit once on initial load)
  const hasFittedBounds = useRef(false);

  // Set challenge focus when peaks are ready
  useEffect(() => {
    if (challengeId && peaks.length > 0) {
      focusChallenge(challengeId, peaks as Array<Peak & { is_summited?: boolean }>);
    }
  }, [challengeId, peaks, focusChallenge]);

  // Auto-fit the map to show all challenge peaks ONCE when peaks first load
  useEffect(() => {
    if (!bounds || hasFittedBounds.current) return;
    hasFittedBounds.current = true;
    const bottomPadding = COLLAPSED_SHEET_HEIGHT + TAB_BAR_HEIGHT + insets.bottom + 20;
    requestFitToBounds(bounds, {
      paddingTop: insets.top + 80,
      paddingBottom: bottomPadding + 300, // extra padding for the sheet content
      paddingLeft: 40,
      paddingRight: 40,
    });
  }, [bounds, insets.bottom, insets.top, requestFitToBounds]);

  const handleShare = useCallback(async () => {
    if (!viewerUserId || !challengeId) return;
    const url = Linking.createURL(`/users/${viewerUserId}/challenges/${challengeId}`);
    const message = `My progress on ${challenge.name ?? "this challenge"}: ${p.completed}/${p.total} (${Math.round(
      (p.completed / Math.max(1, p.total)) * 100
    )}%)\n\n${url}`;
    await Share.share({ message, url }).catch(() => null);
  }, [challenge.name, challengeId, p.completed, p.total, viewerUserId]);

  const handleViewMyProgress = useCallback(() => {
    if (!challengeId) return;
    if (!isAuthenticated || !viewerUserId) {
      startStravaAuth();
      return;
    }
    router.push({
      pathname: "/explore/users/[userId]/challenges/[challengeId]" as any,
      params: { userId: viewerUserId, challengeId },
    });
  }, [challengeId, isAuthenticated, router, viewerUserId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EARLY RETURNS (render loading/error states) - AFTER all hooks
  // ═══════════════════════════════════════════════════════════════════════════

  if (!userId || !challengeId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background as any, padding: 16 }}>
        <Text className="text-foreground">Missing user or challenge.</Text>
      </View>
    );
  }

  if (progress.isLoading && !progress.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background as any, padding: 16 }}>
        <Text className="text-muted-foreground">Loading progress…</Text>
      </View>
    );
  }

  if (!progress.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background as any, padding: 16 }}>
        <Text className="text-muted-foreground">Unable to load this progress.</Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER (data is guaranteed here)
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={{ flex: 1 }}>
      <UserChallengeProgressDetail
        userName={user.name}
        userPic={user.pic ?? null}
        challengeName={challenge.name ?? "Challenge"}
        total={p.total}
        completed={p.completed}
        peaks={peaks}
        onBack={() => router.back()}
        onShare={isOwner ? handleShare : undefined}
        onViewMyProgress={!isOwner ? handleViewMyProgress : undefined}
        onPeakPress={(peakId) =>
          router.push({
            pathname: "/explore/peak/[peakId]" as any,
            params: { peakId },
          })
        }
        onUserPress={() =>
          router.push({
            pathname: "/explore/users/[userId]" as any,
            params: { userId },
          })
        }
        inBottomSheet
      />

      {/* Dismiss (X) - jump back to discovery */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
        }}
      >
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
