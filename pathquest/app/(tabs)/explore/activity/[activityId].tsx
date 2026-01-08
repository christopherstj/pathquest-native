/**
 * Activity Detail Route
 *
 * /explore/activity/[activityId]
 *
 * Owner-only activity data. Renders inside Explore sheet.
 * - Back button returns to previous route
 * - X button dismisses to discovery
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { SummitType } from "@pathquest/shared/types";

import { ActivityDetail, DetailSkeleton } from "@/src/components/explore";
import { useActivityDetails, useUserProfile } from "@/src/hooks";
import { useAuthStore } from "@/src/lib/auth";
import { useMapStore } from "@/src/store/mapStore";
import { useAddReportStore } from "@/src/store";

function getBoundsFromCoords(coords: [number, number][]) {
  if (!coords || coords.length === 0) return null;
  let minLng = coords[0]![0];
  let maxLng = coords[0]![0];
  let minLat = coords[0]![1];
  let maxLat = coords[0]![1];
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

export default function ActivityDetailRoute() {
  const params = useLocalSearchParams<{ activityId?: string | string[] }>();
  const activityId =
    typeof params.activityId === "string"
      ? params.activityId
      : Array.isArray(params.activityId)
        ? params.activityId[0]
        : undefined;
  const router = useRouter();

  // Snapshot the focus we entered from so we can restore it on back navigation
  // (important because previous screens in the stack may stay mounted and not re-run their focus effects)
  const previousFocusRef = useRef(useMapStore.getState().mapFocus);

  const focusDiscovery = useMapStore((s) => s.focusDiscovery);
  const focusActivity = useMapStore((s) => s.focusActivity);
  const focusPeak = useMapStore((s) => s.focusPeak);
  const focusChallenge = useMapStore((s) => s.focusChallenge);
  const focusUser = useMapStore((s) => s.focusUser);
  const requestFitToBounds = useMapStore((s) => s.requestFitToBounds);

  const { data, isLoading, isError } = useActivityDetails(activityId ?? "");

  // Fetch profile stats for achievements (best-effort; does not block rendering)
  const userId = useAuthStore((s) => s.user?.id);
  const userProfile = useUserProfile(userId);

  const didFit = useRef(false);

  const bounds = useMemo(() => {
    const coords = data?.activity?.coords ?? [];
    if (!coords || coords.length < 2) return null;
    return getBoundsFromCoords(coords);
  }, [data?.activity?.coords]);

  useEffect(() => {
    if (!activityId) return;
    if (!data?.activity) return;
    if (!bounds) return;

    // Set map focus for overlay rendering
    focusActivity({
      activityId,
      bounds,
      coords: data.activity.coords ?? [],
      summits: data.summits ?? [],
    });

    // Fit once on initial load
    if (!didFit.current) {
      didFit.current = true;
      requestFitToBounds(bounds, 60);
    }
  }, [activityId, bounds, data?.activity, data?.summits, focusActivity, requestFitToBounds]);

  // Cleanup: restore previous focus on back navigation so the map returns to what the user was viewing.
  useEffect(() => {
    return () => {
      const prev = previousFocusRef.current;
      if (!prev) return;
      switch (prev.type) {
        case "discovery":
          focusDiscovery();
          return;
        case "peak":
          focusPeak(prev.peakId, prev.coords);
          return;
        case "challenge":
          focusChallenge(prev.challengeId, prev.peaks);
          return;
        case "user":
          focusUser(prev.userId, prev.peaks);
          return;
        case "activity":
          // If we somehow came from another activity, restore it.
          focusActivity(prev);
          return;
        default:
          focusDiscovery();
      }
    };
  }, [focusActivity, focusChallenge, focusDiscovery, focusPeak, focusUser]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleDismiss = useCallback(() => {
    focusDiscovery();
    router.navigate("/explore" as any);
  }, [focusDiscovery, router]);

  const openAddReportModal = useAddReportStore((s) => s.openModal);

  const handleAddReport = useCallback((summitId: string, peakId: string) => {
    // Find the summit data from the loaded summits
    const summit = data?.summits?.find((s) => s.id === summitId);
    if (!summit) return;

    // Find the peak name from the summit (if available in the data)
    const peakName = summit.peak_name ?? "Unknown Peak";

    openAddReportModal({
      ascentId: summitId,
      peakId,
      peakName,
      timestamp: summit.timestamp,
      activityId: activityId,
      summitType: "activity" as SummitType,
      notes: summit.notes,
      difficulty: summit.difficulty,
      experienceRating: summit.experience_rating,
      conditionTags: summit.condition_tags,
      customTags: summit.custom_condition_tags,
    });
  }, [data?.summits, activityId, openAddReportModal]);

  const handleEditReport = useCallback((summitId: string, peakId: string) => {
    // Same as add report - the modal handles both cases
    handleAddReport(summitId, peakId);
  }, [handleAddReport]);

  if (!activityId) return null;

  // Show skeleton while loading or when there's no data yet
  if (isLoading || !data) {
    return <DetailSkeleton onBack={handleClose} type="activity" />;
  }

  // Show skeleton if activity is missing (shouldn't happen after data loads, but guard anyway)
  if (!data.activity) {
    return <DetailSkeleton onBack={handleClose} type="activity" />;
  }

  return (
    <ActivityDetail
      activity={data.activity}
      summits={data.summits ?? []}
      profileStats={userProfile.data?.stats}
      onClose={handleClose}
      onDismiss={handleDismiss}
      onAddReport={handleAddReport}
      onEditReport={handleEditReport}
    />
  );
}


