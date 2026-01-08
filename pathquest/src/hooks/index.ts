export { useLocation } from './useLocation';
export type { UserLocation, LocationPermissionStatus } from './useLocation';

export { useMapPeaks, useMapChallenges } from './useMapData';
export { usePeakDetails, usePeakWeather, usePeakActivity, usePeakForecast, usePeakPublicSummitsCursor } from './usePeakDetailData';
export { useCompassHeading } from './useCompassHeading';
export { useLocationPolling } from "./useLocationPolling";
export type { LastKnownLocation } from "./useLocationPolling";
export { useGPSNavigation } from "./useGPSNavigation";
export { useAllChallenges } from "./useAllChallenges";
export { useChallengeDetails } from "./useChallengeDetails";
export { useUserChallengeProgress } from "./useUserChallengeProgress";
export { useNextPeakSuggestion } from "./useNextPeakSuggestion";
export { useActivityDetails } from "./useActivityDetails";
export type { ActivityDetailsResponse } from "./useActivityDetails";
export { 
  useRecentSummits, 
  useFavoriteChallenges, 
  useDashboardData,
  useDashboardStats,
  useSuggestedPeak,
} from './useDashboardData';
export {
  useProfileData,
  useUserProfile,
  useUserPeaks,
  useUserJournal,
  useUserSummitStates,
} from './useProfileData';
export type { JournalEntry, JournalResult, PeaksResult, PeaksFilters, JournalFilters } from './useProfileData';

// Haptic feedback
export { useHaptics } from './useHaptics';
export type { HapticFeedbackType, UseHapticsReturn } from './useHaptics';

// Map navigation
export { useMapNavigation } from './useMapNavigation';

// Device photos
export { useSummitDayPhotos, useRecentPhotos, usePhotoPicker } from './useDevicePhotos';
export type { DevicePhoto, UsePhotoPickerResult } from './useDevicePhotos';
