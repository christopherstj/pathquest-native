/**
 * ManualSummitModal
 *
 * Modal for logging peaks climbed without Strava activities.
 * Matches the web app architecture from AddManualSummitModal.tsx.
 *
 * Features:
 * - Peak info display (pre-selected from Peak Detail)
 * - Optional activity linking with elevation profile
 * - Date/time picker with peak timezone
 * - Difficulty and experience ratings
 * - Trip notes
 * - Photo uploads (same style as AddReportModal)
 */

import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  Mountain,
  Star,
  Smile,
  Zap,
  Flame,
  Check,
  Link2,
  Unlink,
  Calendar,
  Clock,
  Globe,
  ChevronDown,
  Route,
  Search,
  Loader2,
  FileText,
  Camera,
  Image as ImageIcon,
  Plus,
} from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { Difficulty, ExperienceRating, Activity, ActivityStart, Peak, ConditionTag } from "@pathquest/shared/types";
import { endpoints } from "@pathquest/shared/api";
import { Text, Value, CardFrame, PrimaryCTA, SecondaryCTA } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { useManualSummitStore } from "@/src/store/manualSummitStore";
import { useToast } from "@/src/store/toastStore";
import { useOfflineQueueStore, type ManualSummitData, type PendingPhoto } from "@/src/store";
import { getApiClient } from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth";
import { useNetworkStatus } from "@/src/hooks";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

const EXPERIENCE_RATINGS: { value: ExperienceRating; label: string; Icon: typeof Star }[] = [
  { value: "tough", label: "Tough", Icon: Zap },
  { value: "good", label: "Good", Icon: Smile },
  { value: "amazing", label: "Amazing", Icon: Star },
  { value: "epic", label: "Epic", Icon: Flame },
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
];

const CONDITION_TAGS: { tag: ConditionTag; label: string; emoji: string }[] = [
  { tag: "clear", label: "Clear", emoji: "☀️" },
  { tag: "dry", label: "Dry", emoji: "🏜️" },
  { tag: "wet", label: "Wet", emoji: "💧" },
  { tag: "mud", label: "Muddy", emoji: "🌧️" },
  { tag: "snow", label: "Snowy", emoji: "❄️" },
  { tag: "ice", label: "Icy", emoji: "🧊" },
  { tag: "windy", label: "Windy", emoji: "💨" },
  { tag: "foggy", label: "Foggy", emoji: "🌫️" },
  { tag: "rocky", label: "Rocky", emoji: "🪨" },
  { tag: "slippery", label: "Slippery", emoji: "⚠️" },
  { tag: "exposed", label: "Exposed", emoji: "🏔️" },
  { tag: "overgrown", label: "Overgrown", emoji: "🌿" },
  { tag: "bushwhack", label: "Bushwhack", emoji: "🌲" },
  { tag: "postholing", label: "Postholing", emoji: "🦶" },
];

// Theme-aware color functions - called within components that have access to theme
const getDifficultyColors = (colors: any): Record<Difficulty, string> => ({
  easy: colors.statForest,      // Forest green
  moderate: colors.statGold,    // Gold/amber
  hard: colors.secondary,       // Rust/orange
  expert: colors.destructive,   // Red
});

const getExperienceColors = (colors: any): Record<ExperienceRating, string> => ({
  tough: colors.summited,       // Sky blue
  good: colors.statForest,      // Forest green
  amazing: colors.statGold,     // Gold
  epic: colors.primary,         // Primary green (epic!)
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const metersToFt = (meters: number): number => meters * 3.28084;

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Fetch timezone from API based on coordinates.
 * Falls back to America/Denver if the API call fails.
 */
const fetchTimezoneFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const client = getApiClient();
    const timezone = await endpoints.getTimezoneFromCoords(client, lat, lng);
    return timezone;
  } catch (error) {
    console.error("Error fetching timezone from API:", error);
    return "America/Denver"; // Fallback
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface ElevationProfileProps {
  activity: Activity;
  selectedTime: Date | null;
  onSelectTime: (time: Date) => void;
  accentColor: string;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({
  activity,
  selectedTime,
  onSelectTime,
  accentColor,
}) => {
  const { colors } = useTheme();
  const { vert_profile, distance_stream, time_stream, start_time } = activity;

  if (!vert_profile || !distance_stream || vert_profile.length === 0) {
    return (
      <View className="h-24 justify-center items-center">
        <Text className="text-muted-foreground text-sm">No elevation data available</Text>
      </View>
    );
  }

  const width = Dimensions.get("window").width - 80;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const minElevation = Math.min(...vert_profile);
  const maxElevation = Math.max(...vert_profile);
  const elevationRange = maxElevation - minElevation || 1;
  const maxDistance = Math.max(...distance_stream);

  // Build path
  const points = vert_profile.map((elev, i) => {
    const x = padding.left + (distance_stream[i] / maxDistance) * chartWidth;
    const y = padding.top + chartHeight - ((elev - minElevation) / elevationRange) * chartHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Calculate selected position
  let selectedX: number | null = null;
  let selectedY: number | null = null;
  if (selectedTime && time_stream) {
    const tz = timezone?.split(" ").slice(-1)[0] || "UTC";
    const startDate = new Date(start_time);
    const selectedSecs = Math.floor((selectedTime.getTime() - startDate.getTime()) / 1000);
    
    // Find closest index
    let closestIdx = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < time_stream.length; i++) {
      const diff = Math.abs(time_stream[i] - selectedSecs);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }
    
    if (closestIdx < points.length) {
      selectedX = points[closestIdx].x;
      selectedY = points[closestIdx].y;
    }
  }

  const handlePress = (event: any) => {
    if (!time_stream) return;
    
    const { locationX } = event.nativeEvent;
    const relativeX = locationX - padding.left;
    const fraction = Math.max(0, Math.min(1, relativeX / chartWidth));
    const targetDistance = fraction * maxDistance;
    
    // Find closest point
    let closestIdx = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < distance_stream.length; i++) {
      const diff = Math.abs(distance_stream[i] - targetDistance);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }
    
    const timeOffset = time_stream[closestIdx] * 1000;
    const startDate = new Date(start_time);
    const selectedDate = new Date(startDate.getTime() + timeOffset);
    onSelectTime(selectedDate);
  };

  return (
    <Pressable onPress={handlePress}>
      <View 
        className="rounded-xl overflow-hidden"
        style={{ width, height, backgroundColor: colors.muted }}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={accentColor} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          
          {/* Area fill */}
          <Path d={areaD} fill="url(#elevGradient)" />
          
          {/* Line */}
          <Path d={pathD} stroke={accentColor} strokeWidth={2} fill="none" />
          
          {/* Selected indicator */}
          {selectedX !== null && selectedY !== null && (
            <>
              <Line
                x1={selectedX}
                y1={padding.top}
                x2={selectedX}
                y2={height - padding.bottom}
                stroke={colors.primary}
                strokeWidth={2}
              />
              <Circle
                cx={selectedX}
                cy={selectedY}
                r={5}
                fill={colors.primary}
                stroke={colors.background}
                strokeWidth={2}
              />
            </>
          )}
        </Svg>
      </View>
    </Pressable>
  );
};

interface RatingButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color: string;
  Icon?: typeof Star;
  disabled?: boolean;
}

const RatingButton: React.FC<RatingButtonProps> = ({
  label,
  isSelected,
  onPress,
  color,
  Icon,
  disabled,
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="flex-1 items-center justify-center py-2.5 px-1 rounded-xl"
      style={{
        borderWidth: 2,
        borderColor: isSelected ? color : colors.border,
        backgroundColor: isSelected ? `${color}15` : "transparent",
        opacity: disabled ? 0.5 : 1,
      }}
      activeOpacity={0.7}
    >
      {Icon && <Icon size={16} color={isSelected ? color : colors.mutedForeground} />}
      <Text
        className="text-xs font-semibold"
        style={{
          color: isSelected ? color : colors.mutedForeground,
          marginTop: Icon ? 4 : 0,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface ActivityCardProps {
  activity: Activity;
  onUnlink: () => void;
  selectedTime: Date | null;
  onSelectTime: (time: Date) => void;
  accentColor: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onUnlink,
  selectedTime,
  onSelectTime,
  accentColor,
}) => {
  const { colors } = useTheme();
  const startDate = new Date(activity.start_time);
  
  return (
    <CardFrame topo="subtle" seed={`activity-${activity.id}`} className="p-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <Route size={16} color={accentColor} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {activity.title || "Untitled Activity"}
            </Text>
            <Value className="text-xs text-muted-foreground">
              {formatDate(startDate)}
              {activity.distance && ` • ${(activity.distance / 1609.344).toFixed(1)} mi`}
            </Value>
          </View>
        </View>
        <TouchableOpacity onPress={onUnlink} className="p-2">
          <Unlink size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      
      {/* Elevation Profile */}
      {activity.vert_profile && activity.vert_profile.length > 0 && (
        <View className="mt-3">
          <Text className="text-xs text-muted-foreground mb-2">
            Tap on the profile to select summit time:
          </Text>
          <ElevationProfile
            activity={activity}
            selectedTime={selectedTime}
            onSelectTime={onSelectTime}
            accentColor={accentColor}
          />
        </View>
      )}
    </CardFrame>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ManualSummitModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  
  // Store state
  const isOpen = useManualSummitStore((state) => state.isOpen);
  const data = useManualSummitStore((state) => state.data);
  const closeManualSummit = useManualSummitStore((state) => state.closeManualSummit);

  // Form state
  const [summitDate, setSummitDate] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>("America/Denver");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [experience, setExperience] = useState<ExperienceRating | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [conditionTags, setConditionTags] = useState<ConditionTag[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Peak selection state (when opened without pre-selected peak)
  const [selectedPeak, setSelectedPeak] = useState<{
    peakId: string;
    peakName: string;
    peakCoords: [number, number];
    peakElevation?: number;
    peakState?: string;
  } | null>(null);
  const [peakSearch, setPeakSearch] = useState("");
  const [peakSearchResults, setPeakSearchResults] = useState<Peak[]>([]);
  const [loadingPeaks, setLoadingPeaks] = useState(false);

  // Activity linking state
  const [showActivitySearch, setShowActivitySearch] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [nearbyActivities, setNearbyActivities] = useState<ActivityStart[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingActivityDetails, setLoadingActivityDetails] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>("");
  
  // Pending photos (local assets, not yet uploaded)
  const [pendingPhotos, setPendingPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const accentColor = colors.summited;

  // ═══════════════════════════════════════════════════════════════════════════
  // PHOTO HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Upload a single photo to the server (called during submit)
  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset, summitId: string): Promise<boolean> => {
    try {
      const client = getApiClient();

      // 1. Get signed upload URL
      const uploadResponse = await endpoints.getPhotoUploadUrl(client, {
        filename: asset.fileName ?? `photo-${Date.now()}.jpg`,
        contentType: asset.mimeType ?? "image/jpeg",
        summitType: "manual",
        summitId,
      });

      // 2. Upload to GCS
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      await fetch(uploadResponse.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": asset.mimeType ?? "image/jpeg",
        },
        body: blob,
      });

      // 3. Complete upload (triggers thumbnail generation)
      await endpoints.completePhotoUpload(client, {
        photoId: uploadResponse.photoId,
        width: asset.width,
        height: asset.height,
        takenAt: asset.exif?.DateTimeOriginal,
      });

      return true;
    } catch (error) {
      console.error("Photo upload failed:", error);
      return false;
    }
  };

  // Launch camera to take a new photo (stores locally, uploads on submit)
  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    setPendingPhotos((prev) => [...prev, result.assets[0]]);
  }, []);

  // Launch photo library to pick existing photos (stores locally, uploads on submit)
  const handlePickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library access is needed to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    setPendingPhotos((prev) => [...prev, result.assets[0]]);
  }, []);

  // Remove a pending photo (before upload)
  const handleRemovePhoto = useCallback((index: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Determine if we have a pre-selected peak or need to search
  const hasPeakPreselected = data?.peakId && data.peakId !== "";
  
  // The active peak data (either pre-selected or user-selected)
  const activePeak = hasPeakPreselected
    ? {
        peakId: data!.peakId,
        peakName: data!.peakName,
        peakCoords: data!.peakCoords,
        peakElevation: data?.peakElevation,
        peakState: data?.peakState,
      }
    : selectedPeak;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && data) {
      const now = new Date();
      setSummitDate(now);
      
      // Get timezone from peak coords (if available)
      if (data.peakCoords[0] !== 0 && data.peakCoords[1] !== 0) {
        fetchTimezoneFromCoords(data.peakCoords[1], data.peakCoords[0]).then(setTimezone);
      }
      
      setNotes("");
      setDifficulty(null);
      setExperience(null);
      setIsPublic(true);
      setConditionTags([]);
      setCustomTags([]);
      setCustomTagInput("");
      setShowActivitySearch(false);
      setActivitySearch("");
      setNearbyActivities([]);
      setSelectedActivityId(data.preselectedActivityId || null);
      setSelectedActivity(null);
      setIsSubmitting(false);
      setSubmitStatus("");
      setPendingPhotos([]);
      
      // Reset peak search state
      setSelectedPeak(null);
      setPeakSearch("");
      setPeakSearchResults([]);
    }
  }, [isOpen, data]);

  // Search for peaks when user types
  useEffect(() => {
    if (!isOpen || hasPeakPreselected || !peakSearch.trim()) {
      setPeakSearchResults([]);
      return;
    }

    const searchPeaks = async () => {
      setLoadingPeaks(true);
      try {
        const client = getApiClient();
        const peaks = await endpoints.getPeaks(client, {
          page: 1,
          perPage: 10,
          search: peakSearch.trim(),
        });
        setPeakSearchResults(peaks);
      } catch (error) {
        console.error("Error searching peaks:", error);
        setPeakSearchResults([]);
      }
      setLoadingPeaks(false);
    };

    const debounceTimer = setTimeout(searchPeaks, 300);
    return () => clearTimeout(debounceTimer);
  }, [isOpen, hasPeakPreselected, peakSearch]);

  // Search for nearby activities
  useEffect(() => {
    if (!isOpen || !activePeak || !showActivitySearch) return;
    
    const searchActivities = async () => {
      setLoadingActivities(true);
      try {
        const client = getApiClient();
        const activities = await endpoints.searchNearestActivities(
          client,
          {
            lat: activePeak.peakCoords[1],
            lng: activePeak.peakCoords[0],
            page: 1,
            search: activitySearch || undefined,
          }
        );
        setNearbyActivities(activities);
      } catch (error) {
        console.error("Error searching activities:", error);
        setNearbyActivities([]);
      }
      setLoadingActivities(false);
    };

    const debounceTimer = setTimeout(searchActivities, 300);
    return () => clearTimeout(debounceTimer);
  }, [isOpen, activePeak, showActivitySearch, activitySearch]);

  // Fetch activity details when selected
  useEffect(() => {
    if (!selectedActivityId) {
      setSelectedActivity(null);
      return;
    }

    const fetchActivityDetails = async () => {
      setLoadingActivityDetails(true);
      try {
        const client = getApiClient();
        const details = await endpoints.getActivityDetails(client, selectedActivityId);
        if (details?.activity) {
          setSelectedActivity(details.activity);
          // Inherit timezone from activity
          if (details.activity.timezone) {
            const activityTz = details.activity.timezone.split(" ").slice(-1)[0];
            setTimezone(activityTz);
          }
          // Set initial date/time from activity start
          const activityStart = new Date(details.activity.start_time);
          setSummitDate(activityStart);
        }
      } catch (error) {
        console.error("Error fetching activity details:", error);
      }
      setLoadingActivityDetails(false);
    };

    fetchActivityDetails();
  }, [selectedActivityId]);

  const handleSelectActivity = (activity: ActivityStart) => {
    setSelectedActivityId(activity.id);
    setShowActivitySearch(false);
  };

  const handleUnlinkActivity = async () => {
    setSelectedActivityId(null);
    setSelectedActivity(null);
    // Reset timezone to peak timezone
    if (activePeak) {
      fetchTimezoneFromCoords(activePeak.peakCoords[1], activePeak.peakCoords[0]).then(setTimezone);
    }
  };

  const handleSelectPeak = (peak: Peak) => {
    const coords: [number, number] = peak.location_coords || [0, 0];
    setSelectedPeak({
      peakId: peak.id,
      peakName: peak.name,
      peakCoords: coords,
      peakElevation: peak.elevation,
      peakState: peak.state,
    });
    setPeakSearch("");
    setPeakSearchResults([]);
    
    // Update timezone based on selected peak
    if (coords[0] !== 0 && coords[1] !== 0) {
      fetchTimezoneFromCoords(coords[1], coords[0]).then(setTimezone);
    }
  };

  const handleClearPeak = () => {
    setSelectedPeak(null);
    setPeakSearch("");
    // Also clear activity linking
    setSelectedActivityId(null);
    setSelectedActivity(null);
  };

  const toggleConditionTag = (tag: ConditionTag) => {
    setConditionTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags((prev) => [...prev, trimmed]);
    }
    setCustomTagInput("");
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const newDate = new Date(summitDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setSummitDate(newDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedDate) {
      const newDate = new Date(summitDate);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setSummitDate(newDate);
    }
  };

  // Network status for offline queueing
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable !== false;
  const queueSubmission = useOfflineQueueStore((s) => s.queueSubmission);

  const handleSubmit = async () => {
    if (!activePeak || !user?.id) return;

    setIsSubmitting(true);

    // Check if offline - queue for later
    if (!isOnline) {
      try {
        const manualSummitData: ManualSummitData = {
          peakId: activePeak.peakId,
          peakName: activePeak.peakName,
          summitDate: summitDate.toISOString(),
          timezone,
          activityId: selectedActivityId || undefined,
          difficulty: difficulty || undefined,
          experience: experience || undefined,
          notes: notes || undefined,
          tags: customTags.length > 0 ? customTags : undefined,
          conditionTags: conditionTags.length > 0 ? conditionTags : undefined,
          userId: user.id,
        };

        // Queue photos
        const queuedPhotos: PendingPhoto[] = pendingPhotos.map((p) => ({
          uri: p.uri,
          filename: p.filename,
          width: p.width,
          height: p.height,
        }));

        await queueSubmission('manual_summit', manualSummitData, queuedPhotos);
        
        toast.info(
          `${activePeak.peakName} has been saved and will be uploaded when you're back online.`,
          'Saved Offline'
        );
        closeManualSummit();
      } catch (error) {
        console.error("Failed to queue summit:", error);
        toast.error("Failed to save summit offline. Please try again.", "Error");
      } finally {
        setIsSubmitting(false);
        setSubmitStatus("");
      }
      return;
    }

    // Online - submit immediately
    try {
      const client = getApiClient();
      
      // Phase 1: Create the summit
      setSubmitStatus("Saving summit...");
      const summitId = `${user.id}-${activePeak.peakId}-${summitDate.toISOString()}`;
      
      await endpoints.addManualPeakSummit(client, {
        id: summitId,
        user_id: user.id,
        peak_id: activePeak.peakId,
        activity_id: selectedActivityId || undefined,
        notes: notes || undefined,
        is_public: isPublic,
        timestamp: summitDate.toISOString(),
        timezone,
        difficulty: difficulty || undefined,
        experience_rating: experience || undefined,
        condition_tags: conditionTags.length > 0 ? conditionTags : undefined,
        custom_condition_tags: customTags.length > 0 ? customTags : undefined,
      });

      // Phase 2: Upload photos (if any)
      if (pendingPhotos.length > 0) {
        let successCount = 0;
        for (let i = 0; i < pendingPhotos.length; i++) {
          setSubmitStatus(`Uploading photo ${i + 1} of ${pendingPhotos.length}...`);
          const success = await uploadPhoto(pendingPhotos[i], summitId);
          if (success) successCount++;
        }

        if (successCount < pendingPhotos.length) {
          toast.warning(
            `${activePeak.peakName} saved, but ${pendingPhotos.length - successCount} photo(s) failed to upload.`,
            "Summit Logged"
          );
        } else {
          toast.success(
            `${activePeak.peakName} saved with ${successCount} photo(s).`,
            "Summit Logged!"
          );
        }
      } else {
        toast.success(
          `${activePeak.peakName} has been added to your logbook.`,
          "Summit Logged!"
        );
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["peakDetails", activePeak.peakId] });
      queryClient.invalidateQueries({ queryKey: ["recentSummits"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userPeaks"] });
      queryClient.invalidateQueries({ queryKey: ["userJournal"] });
      if (selectedActivityId) {
        queryClient.invalidateQueries({ queryKey: ["activityDetails", selectedActivityId] });
      }

      // Close the modal on success
      closeManualSummit();
    } catch (error: any) {
      console.error("Error logging summit:", error);
      toast.error(
        error?.message || "Failed to log summit",
        "Error"
      );
    }

    setIsSubmitting(false);
    setSubmitStatus("");
  };

  const timezoneLabel = useMemo(() => {
    const found = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
    return found?.label || timezone;
  }, [timezone]);

  if (!isOpen || !data) return null;

  // Get theme-aware colors for ratings
  const difficultyColors = getDifficultyColors(colors);
  const experienceColors = getExperienceColors(colors);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={closeManualSummit}
    >
      {/* GestureHandlerRootView is required inside Modal for gesture-based components like PrimaryCTA/SecondaryCTA */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Backdrop */}
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={closeManualSummit}
          />

          {/* Modal Content */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "90%",
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderColor: colors.border }}>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
                  Log Summit
                </Text>
                {activePeak && (
                  <Text className="text-sm" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                    {activePeak.peakName}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closeManualSummit} className="p-2 -mr-2">
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-4"
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
              keyboardShouldPersistTaps="handled"
            >
          {/* Peak Selection / Info Card */}
          {activePeak ? (
            <CardFrame topo="subtle" seed={`peak-${activePeak.peakId}`} className="p-3.5 mb-4">
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Mountain size={20} color={accentColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {activePeak.peakName}
                  </Text>
                  <Value className="text-sm text-muted-foreground">
                    {activePeak.peakElevation
                      ? `${Math.round(metersToFt(activePeak.peakElevation)).toLocaleString()} ft`
                      : ""}
                    {activePeak.peakState ? ` • ${activePeak.peakState}` : ""}
                  </Value>
                </View>
                {!hasPeakPreselected && (
                  <TouchableOpacity onPress={handleClearPeak} className="p-2">
                    <X size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            </CardFrame>
          ) : (
            <View className="mb-4">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Mountain size={14} color={colors.mutedForeground} />
                <Text className="text-sm font-medium text-muted-foreground">
                  Select Peak
                </Text>
              </View>
              <View
                className="flex-row items-center rounded-xl px-3"
                style={{
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                  placeholder="Search for a peak..."
                  placeholderTextColor={colors.mutedForeground}
                  value={peakSearch}
                  onChangeText={setPeakSearch}
                  autoFocus
                  className="flex-1 py-3 px-2 text-sm"
                  style={{ color: colors.foreground }}
                />
              </View>
              
              {/* Peak Search Results */}
              {loadingPeaks ? (
                <View className="p-5 items-center">
                  <ActivityIndicator color={accentColor} />
                </View>
              ) : peakSearchResults.length > 0 ? (
                <View
                  className="mt-2 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    maxHeight: 250,
                  }}
                >
                  {peakSearchResults.map((peak, idx) => (
                    <TouchableOpacity
                      key={peak.id}
                      onPress={() => handleSelectPeak(peak)}
                      className="flex-row items-center gap-2.5 py-3 px-3"
                      style={{
                        borderBottomWidth: idx < peakSearchResults.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${accentColor}15` }}
                      >
                        <Mountain size={16} color={accentColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                          {peak.name}
                        </Text>
                        <Value className="text-xs text-muted-foreground" numberOfLines={1}>
                          {peak.elevation ? `${Math.round(metersToFt(peak.elevation)).toLocaleString()} ft` : ""}
                          {peak.state ? ` • ${peak.state}` : ""}
                          {peak.county ? `, ${peak.county}` : ""}
                        </Value>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : peakSearch.trim().length > 0 ? (
                <Text className="text-center text-muted-foreground p-4">
                  No peaks found matching "{peakSearch}"
                </Text>
              ) : null}
            </View>
          )}

          {/* Activity Linking - Only show when peak is selected */}
          {activePeak && (
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Link2 size={14} color={colors.mutedForeground} />
              <Text className="text-sm font-medium text-muted-foreground">
                Link to Activity (Optional)
              </Text>
            </View>

            {loadingActivityDetails ? (
              <View className="p-5 items-center">
                <ActivityIndicator color={accentColor} />
              </View>
            ) : selectedActivity ? (
              <ActivityCard
                activity={selectedActivity}
                onUnlink={handleUnlinkActivity}
                selectedTime={summitDate}
                onSelectTime={setSummitDate}
                accentColor={accentColor}
              />
            ) : showActivitySearch ? (
              <CardFrame topo="none" seed="activity-search" className="p-3">
                {/* Search Input */}
                <View
                  className="flex-row items-center rounded-xl px-3 mb-2"
                  style={{ backgroundColor: colors.input }}
                >
                  <Search size={16} color={colors.mutedForeground} />
                  <TextInput
                    placeholder="Search your activities..."
                    placeholderTextColor={colors.mutedForeground}
                    value={activitySearch}
                    onChangeText={setActivitySearch}
                    className="flex-1 py-2.5 px-2 text-sm"
                    style={{ color: colors.foreground }}
                  />
                </View>

                {/* Results */}
                <View style={{ maxHeight: 200 }}>
                  {loadingActivities ? (
                    <View className="p-5 items-center">
                      <ActivityIndicator color={accentColor} />
                    </View>
                  ) : nearbyActivities.length > 0 ? (
                    nearbyActivities.map((activity) => (
                      <TouchableOpacity
                        key={activity.id}
                        onPress={() => handleSelectActivity(activity)}
                        className="py-2.5 px-1"
                        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                      >
                        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                          {activity.title || "Untitled Activity"}
                        </Text>
                        <Value className="text-xs text-muted-foreground">
                          {formatDate(new Date(activity.start_time))}
                          {activity.distance && ` • ${(activity.distance / 1609.344).toFixed(1)} mi`}
                          {activity.gain && ` • ${Math.round(metersToFt(activity.gain)).toLocaleString()} ft gain`}
                        </Value>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text className="text-center text-muted-foreground p-4">
                      No activities found nearby
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setShowActivitySearch(false)}
                  className="items-center py-2.5"
                >
                  <Text className="text-muted-foreground text-sm">Cancel</Text>
                </TouchableOpacity>
              </CardFrame>
            ) : (
              <SecondaryCTA
                label="Search nearby activities"
                onPress={() => setShowActivitySearch(true)}
                Icon={Search}
              />
            )}
          </View>
          )}

          {/* Date & Time */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Calendar size={14} color={colors.mutedForeground} />
                <Text className="text-sm font-medium text-muted-foreground">Date</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="rounded-xl py-3 px-3"
                style={{
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Value className="text-sm text-foreground">
                  {formatDate(summitDate)}
                </Value>
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Clock size={14} color={colors.mutedForeground} />
                <Text className="text-sm font-medium text-muted-foreground">Time</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                className="rounded-xl py-3 px-3"
                style={{
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Value className="text-sm text-foreground">
                  {formatTime(summitDate)}
                </Value>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timezone */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Globe size={14} color={colors.mutedForeground} />
              <Text className="text-sm font-medium text-muted-foreground">Timezone</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowTimezonePicker(!showTimezonePicker)}
              disabled={!!selectedActivity}
              className="rounded-xl py-3 px-3 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: selectedActivity ? 0.6 : 1,
              }}
            >
              <Value className="text-sm text-foreground">{timezoneLabel}</Value>
              <ChevronDown size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {selectedActivity && (
              <Text className="text-xs text-muted-foreground mt-1">
                Inherited from linked activity
              </Text>
            )}
            {showTimezonePicker && !selectedActivity && (
              <View
                className="mt-1 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <TouchableOpacity
                    key={tz.value}
                    onPress={() => {
                      setTimezone(tz.value);
                      setShowTimezonePicker(false);
                    }}
                    className="py-3 px-3"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: timezone === tz.value ? `${accentColor}15` : "transparent",
                    }}
                  >
                    <Text
                      className={timezone === tz.value ? "text-sm font-semibold" : "text-sm"}
                      style={{ color: timezone === tz.value ? accentColor : colors.foreground }}
                    >
                      {tz.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Notes */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <FileText size={14} color={colors.mutedForeground} />
              <Text className="text-sm font-medium text-muted-foreground">
                Trip Notes
              </Text>
            </View>
            <TextInput
              placeholder="What made this summit special?"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              className="rounded-xl py-3 px-3 text-sm"
              style={{
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.foreground,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Difficulty */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted-foreground mb-2">
              How difficult was it?
            </Text>
            <View className="flex-row gap-2">
              {DIFFICULTIES.map((d) => (
                <RatingButton
                  key={d.value}
                  label={d.label}
                  isSelected={difficulty === d.value}
                  onPress={() => setDifficulty(difficulty === d.value ? null : d.value)}
                  color={difficultyColors[d.value]}
                  disabled={isSubmitting}
                />
              ))}
            </View>
          </View>

          {/* Experience */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted-foreground mb-2">
              How was your experience?
            </Text>
            <View className="flex-row gap-2">
              {EXPERIENCE_RATINGS.map((e) => (
                <RatingButton
                  key={e.value}
                  label={e.label}
                  isSelected={experience === e.value}
                  onPress={() => setExperience(experience === e.value ? null : e.value)}
                  color={experienceColors[e.value]}
                  Icon={e.Icon}
                  disabled={isSubmitting}
                />
              ))}
            </View>
          </View>

          {/* Condition Tags */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted-foreground mb-2">
              Conditions
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CONDITION_TAGS.map(({ tag, label, emoji }) => {
                const isSelected = conditionTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleConditionTag(tag)}
                    activeOpacity={0.7}
                    className="px-3 py-2 rounded-lg border flex-row items-center gap-1.5"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? `${accentColor}25`
                          : `${accentColor}15`
                        : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
                      borderColor: isSelected ? accentColor : colors.border,
                    }}
                  >
                    {isSelected && <Check size={12} color={accentColor} />}
                    <Text className="text-sm">{emoji}</Text>
                    <Text
                      className="text-sm"
                      style={{ color: isSelected ? accentColor : colors.foreground }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Custom Tags */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-muted-foreground mb-2">
              Custom Tags
            </Text>

            {/* Existing custom tags */}
            {customTags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {customTags.map((tag) => (
                  <View
                    key={tag}
                    className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Text className="text-sm" style={{ color: accentColor }}>
                      {tag}
                    </Text>
                    <TouchableOpacity onPress={() => removeCustomTag(tag)}>
                      <X size={14} color={accentColor} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add custom tag input */}
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Add custom tag..."
                placeholderTextColor={colors.mutedForeground}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                onSubmitEditing={() => addCustomTag(customTagInput)}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => addCustomTag(customTagInput)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Plus size={20} color={accentColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photos Section - Select photos upfront, upload on submit */}
          <View className="mb-6">
            <View className="flex-row items-center gap-1.5 mb-2">
              <ImageIcon size={14} color={colors.mutedForeground} />
              <Text className="text-sm font-medium text-muted-foreground">
                Photos (Optional)
              </Text>
            </View>

            {pendingPhotos.length === 0 ? (
              // Empty state - prominent picker UI
              <View className="gap-3">
                <TouchableOpacity
                  onPress={handlePickFromLibrary}
                  activeOpacity={0.7}
                  className="rounded-xl border-2 border-dashed p-6 items-center justify-center"
                  style={{
                    borderColor: `${accentColor}50`,
                    backgroundColor: isDark ? `${accentColor}08` : `${accentColor}05`,
                  }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <ImageIcon size={28} color={accentColor} />
                  </View>
                  <Text className="text-base font-semibold mb-1 text-foreground">
                    Add Photos from Library
                  </Text>
                  <Text className="text-sm text-center text-muted-foreground">
                    Select photos from your recent hike
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center gap-2 py-3"
                >
                  <Camera size={18} color={colors.mutedForeground} />
                  <Text className="text-sm text-muted-foreground">
                    Or take a new photo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Photo grid with pending photos
              <View className="gap-3">
                <View className="flex-row flex-wrap gap-2">
                  {pendingPhotos.map((photo, index) => (
                    <View key={`pending-${index}`} className="w-24 h-24 rounded-lg overflow-hidden relative">
                      <Image
                        source={{ uri: photo.uri }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <X size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add More Button */}
                  <TouchableOpacity
                    onPress={handlePickFromLibrary}
                    activeOpacity={0.7}
                    className="w-24 h-24 rounded-lg border-2 border-dashed items-center justify-center"
                    style={{
                      borderColor: `${accentColor}40`,
                      backgroundColor: isDark ? `${accentColor}08` : `${accentColor}05`,
                    }}
                  >
                    <Plus size={24} color={accentColor} />
                    <Text className="text-[10px] mt-1" style={{ color: accentColor }}>
                      Add More
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-2 py-2"
                >
                  <Camera size={16} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">
                    Take a new photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <PrimaryCTA
            label={isSubmitting ? submitStatus || "Saving..." : `Log Summit${pendingPhotos.length > 0 ? ` (${pendingPhotos.length} photo${pendingPhotos.length > 1 ? "s" : ""})` : ""}`}
            onPress={handleSubmit}
            disabled={isSubmitting || !activePeak}
            Icon={isSubmitting ? Loader2 : Check}
          />
            </ScrollView>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DateTimePicker
                value={summitDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
              <DateTimePicker
                value={summitDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ManualSummitModal;

