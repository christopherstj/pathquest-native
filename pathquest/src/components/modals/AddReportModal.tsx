/**
 * AddReportModal
 *
 * Camera-first, minimal-friction trip report entry modal.
 * Based on DESIGN.md Section 7.
 *
 * Features:
 * - Camera-first photo capture (prominent photo area)
 * - Condition tags (multi-select)
 * - Difficulty (single-select)
 * - Experience rating (single-select)
 * - Notes (expandable textarea)
 * - Photo upload with progress
 */

import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { format } from "date-fns";
import {
  X,
  Camera,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Mountain,
  Star,
  Smile,
  Zap,
  Flame,
  Image as ImageIcon,
  Images,
} from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { Difficulty, ExperienceRating, ConditionTag, SummitPhoto, SummitType } from "@pathquest/shared/types";
import { endpoints } from "@pathquest/shared/api";
import { Text, CardFrame, PrimaryCTA } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { useAddReportStore, type PhotoUploadProgress } from "@/src/store/addReportStore";
import { useOfflineQueueStore, useToast, type TripReportData, type PendingPhoto } from "@/src/store";
import { getApiClient } from "@/src/lib/api";
import { useSummitDayPhotos, useNetworkStatus, type DevicePhoto } from "@/src/hooks";
import { PhotoPickerModal } from "@/src/components/shared/PhotoPickerModal";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

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

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

const EXPERIENCE_RATINGS: { value: ExperienceRating; label: string; Icon: typeof Star }[] = [
  { value: "amazing", label: "Amazing", Icon: Star },
  { value: "good", label: "Good", Icon: Smile },
  { value: "tough", label: "Tough", Icon: Zap },
  { value: "epic", label: "Epic", Icon: Flame },
];

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface PhotoSectionProps {
  photos: SummitPhoto[];
  uploadProgress: Map<string, PhotoUploadProgress>;
  onPickFromLibrary: () => void;
  onTakePhoto: () => void;
  onRemovePhoto: (photoId: string) => void;
  onSelectDevicePhoto: (photo: DevicePhoto) => void;
  onOpenFullPicker: () => void;
  accentColor: string;
  isLoading?: boolean;
  summitDayPhotos: DevicePhoto[];
  summitDayPhotosLoading: boolean;
  summitTimestamp: string | null;
  /** IDs of photos already selected/uploaded */
  selectedPhotoIds: Set<string>;
}

const PhotoSection: React.FC<PhotoSectionProps> = ({
  photos,
  uploadProgress,
  onPickFromLibrary,
  onTakePhoto,
  onRemovePhoto,
  onSelectDevicePhoto,
  onOpenFullPicker,
  accentColor,
  isLoading,
  summitDayPhotos,
  summitDayPhotosLoading,
  summitTimestamp,
  selectedPhotoIds,
}) => {
  const { colors, isDark } = useTheme();

  // Format summit date for display
  const formattedDate = useMemo(() => {
    if (!summitTimestamp) return 'this day';
    try {
      // Normalize PostgreSQL timestamp format before parsing
      // "2024-01-15 12:00:00+00" -> "2024-01-15T12:00:00+00:00"
      let normalized = summitTimestamp.trim();
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}$/.test(normalized)) {
        normalized = normalized.replace(' ', 'T') + ':00';
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
        normalized = normalized.replace(' ', 'T');
      }
      return format(new Date(normalized), 'MMM d, yyyy');
    } catch {
      return 'this day';
    }
  }, [summitTimestamp]);

  // Filter out already selected photos from summit day photos
  const availableSummitDayPhotos = useMemo(() => {
    return summitDayPhotos.filter(p => !selectedPhotoIds.has(p.id));
  }, [summitDayPhotos, selectedPhotoIds]);

  // Loading state for existing photos
  if (isLoading) {
    return (
      <View className="h-24 items-center justify-center">
        <ActivityIndicator size="small" color={accentColor} />
        <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
          Loading photos...
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Summit Day Photos Section (inline selectable) */}
      {(availableSummitDayPhotos.length > 0 || summitDayPhotosLoading) && (
        <View className="gap-2">
          <View
            className="px-3 py-2 rounded-lg"
            style={{
              backgroundColor: isDark ? `${accentColor}15` : `${accentColor}10`,
              borderLeftWidth: 3,
              borderLeftColor: accentColor,
            }}
          >
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: accentColor }}
            >
              Photos from {formattedDate}
            </Text>
          </View>
          
          {summitDayPhotosLoading ? (
            <View className="h-16 items-center justify-center">
              <ActivityIndicator size="small" color={accentColor} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              {availableSummitDayPhotos.slice(0, 8).map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => onSelectDevicePhoto(photo)}
                  activeOpacity={0.7}
                  className="w-16 h-16 rounded-lg overflow-hidden relative"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {/* Tap indicator */}
                  <View
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
                  >
                    <View
                      className="w-5 h-5 rounded-full border-2 items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.2)' }}
                    >
                      <Plus size={12} color="rgba(255,255,255,0.9)" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {availableSummitDayPhotos.length > 8 && (
                <TouchableOpacity
                  onPress={onOpenFullPicker}
                  activeOpacity={0.7}
                  className="w-16 h-16 rounded-lg items-center justify-center"
                  style={{ backgroundColor: isDark ? colors.card : colors.muted }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.mutedForeground }}>
                    +{availableSummitDayPhotos.length - 8}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Selected/Uploaded Photos */}
      {photos.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.mutedForeground }}>
            Selected ({photos.length})
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {photos.map((photo) => {
              const progress = uploadProgress.get(photo.id);
              const isUploading = progress && progress.status !== "complete";

              return (
                <View key={photo.id} className="w-20 h-20 rounded-lg overflow-hidden relative">
                  <Image
                    source={{ uri: photo.thumbnailUrl || photo.fullUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />

                  {/* Upload Progress Overlay */}
                  {isUploading && (
                    <View
                      className="absolute inset-0 items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <ActivityIndicator size="small" color={accentColor} />
                      <Text className="text-white text-xs mt-1">{Math.round(progress?.progress ?? 0)}%</Text>
                    </View>
                  )}

                  {/* Delete Button */}
                  {!isUploading && (
                    <TouchableOpacity
                      onPress={() => onRemovePhoto(photo.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {/* Browse All Photos */}
        <TouchableOpacity
          onPress={onOpenFullPicker}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : colors.muted,
          }}
        >
          <Images size={18} color={accentColor} />
          <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
            Browse All
          </Text>
        </TouchableOpacity>

        {/* Take Photo */}
        <TouchableOpacity
          onPress={onTakePhoto}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : colors.muted,
          }}
        >
          <Camera size={18} color={accentColor} />
          <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
            Take Photo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ConditionTagsProps {
  selectedTags: ConditionTag[];
  onToggle: (tag: ConditionTag) => void;
  accentColor: string;
}

const ConditionTagsSection: React.FC<ConditionTagsProps> = ({ selectedTags, onToggle, accentColor }) => {
  const { colors, isDark } = useTheme();

  return (
    <View className="flex-row flex-wrap gap-2">
      {CONDITION_TAGS.map(({ tag, label, emoji }) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            onPress={() => onToggle(tag)}
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
  );
};

// Theme-aware color functions for ratings
const getDifficultyColors = (colors: any): Record<Difficulty, string> => ({
  easy: colors.primary,        // Emerald green
  moderate: colors.statGold,    // Gold/amber
  hard: colors.secondary,       // Rust/orange
  expert: colors.destructive,   // Red
});

const getExperienceColors = (colors: any): Record<ExperienceRating, string> => ({
  tough: colors.summited,       // Sky blue
  good: colors.primary,          // Emerald green
  amazing: colors.statGold,     // Gold
  epic: colors.primary,         // Primary green (epic!)
});

interface DifficultyPickerProps {
  selected: Difficulty | null;
  onSelect: (difficulty: Difficulty | null) => void;
}

const DifficultyPicker: React.FC<DifficultyPickerProps> = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const difficultyColors = getDifficultyColors(colors);

  return (
    <View className="flex-row gap-2">
      {DIFFICULTIES.map(({ value, label }) => {
        const isSelected = selected === value;
        const color = difficultyColors[value];
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(isSelected ? null : value)}
            activeOpacity={0.7}
            className="flex-1 items-center justify-center py-2.5 px-1 rounded-xl"
            style={{
              borderWidth: 2,
              borderColor: isSelected ? color : colors.border,
              backgroundColor: isSelected ? `${color}15` : "transparent",
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: isSelected ? color : colors.mutedForeground,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface ExperiencePickerProps {
  selected: ExperienceRating | null;
  onSelect: (rating: ExperienceRating | null) => void;
}

const ExperiencePicker: React.FC<ExperiencePickerProps> = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const experienceColors = getExperienceColors(colors);

  return (
    <View className="flex-row gap-2">
      {EXPERIENCE_RATINGS.map(({ value, label, Icon }) => {
        const isSelected = selected === value;
        const color = experienceColors[value];
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(isSelected ? null : value)}
            activeOpacity={0.7}
            className="flex-1 items-center justify-center py-2.5 px-1 rounded-xl"
            style={{
              borderWidth: 2,
              borderColor: isSelected ? color : colors.border,
              backgroundColor: isSelected ? `${color}15` : "transparent",
            }}
          >
            <Icon size={16} color={isSelected ? color : colors.mutedForeground} />
            <Text
              className="text-xs font-semibold"
              style={{
                color: isSelected ? color : colors.mutedForeground,
                marginTop: 4,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AddReportModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");

  const {
    isOpen,
    data,
    notes,
    difficulty,
    experienceRating,
    conditionTags,
    customTags,
    photos,
    uploadProgress,
    isLoadingPhotos,
    isSubmitting,
    closeModal,
    setNotes,
    setDifficulty,
    setExperienceRating,
    toggleConditionTag,
    addCustomTag,
    removeCustomTag,
    setPhotos,
    addPhoto,
    removePhoto,
    setUploadProgress,
    clearUploadProgress,
    setIsLoadingPhotos,
    setIsSubmitting,
  } = useAddReportStore();

  const accentColor = colors.summited as string;

  // Load existing photos when modal opens
  useEffect(() => {
    if (isOpen && data) {
      loadExistingPhotos();
    }
  }, [isOpen, data]);

  const loadExistingPhotos = async () => {
    if (!data) return;

    setIsLoadingPhotos(true);
    try {
      const client = getApiClient();
      // ascentId is the activities_peaks.id (composite) for activity summits, or user_peak_manual.id for manual
      const summitId = data.ascentId;
      if (!summitId) {
        console.warn("Cannot load photos: missing summitId for summitType", data.summitType);
        return;
      }
      const response = await endpoints.getSummitPhotos(client, {
        summitType: data.summitType,
        summitId,
      });
      setPhotos(response.photos);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Process a picked/captured image asset
  const processImageAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    if (!data) return;

    const tempPhotoId = `temp-${Date.now()}`;

    // Create temporary photo entry for UI
    const tempPhoto: SummitPhoto = {
      id: tempPhotoId,
      thumbnailUrl: asset.uri,
      fullUrl: asset.uri,
      caption: null,
      takenAt: asset.exif?.DateTimeOriginal ?? null,
    };
    addPhoto(tempPhoto);

    // Set initial upload progress
    setUploadProgress(tempPhotoId, { progress: 0, status: "uploading" });

    try {
      const client = getApiClient();

      // 1. Get signed upload URL
      // ascentId is the activities_peaks.id (composite) for activity summits, or user_peak_manual.id for manual
      const summitId = data.ascentId;
      if (!summitId) {
        Alert.alert("Error", "Cannot upload photo: missing summit ID.");
        removePhoto(tempPhotoId);
        clearUploadProgress(tempPhotoId);
        return;
      }

      console.log('[AddReportModal] Uploading photo with:', {
        summitType: data.summitType,
        summitId,
        ascentId: data.ascentId,
        activityId: data.activityId,
      });

      const uploadResponse = await endpoints.getPhotoUploadUrl(client, {
        filename: asset.fileName ?? `photo-${Date.now()}.jpg`,
        contentType: asset.mimeType ?? "image/jpeg",
        summitType: data.summitType,
        summitId,
      });

      setUploadProgress(tempPhotoId, { progress: 20, status: "uploading" });

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

      setUploadProgress(tempPhotoId, { progress: 70, status: "processing" });

      // 3. Complete upload (triggers thumbnail generation)
      const completeResponse = await endpoints.completePhotoUpload(client, {
        photoId: uploadResponse.photoId,
        width: asset.width,
        height: asset.height,
        takenAt: asset.exif?.DateTimeOriginal,
      });

      setUploadProgress(tempPhotoId, { progress: 100, status: "complete" });

      // Replace temp photo with real photo data
      removePhoto(tempPhotoId);
      clearUploadProgress(tempPhotoId);
      addPhoto({
        id: completeResponse.id,
        thumbnailUrl: completeResponse.thumbnailUrl,
        fullUrl: completeResponse.thumbnailUrl,
        caption: null,
        takenAt: asset.exif?.DateTimeOriginal ?? null,
      });
    } catch (error) {
      console.error("Photo upload failed:", error);
      setUploadProgress(tempPhotoId, {
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      } as any);
      Alert.alert("Upload Failed", "Failed to upload photo. Please try again.");
      removePhoto(tempPhotoId);
      clearUploadProgress(tempPhotoId);
    }
  }, [data, addPhoto, removePhoto, setUploadProgress, clearUploadProgress]);

  // Launch camera to take a new photo
  const handleTakePhoto = useCallback(async () => {
    if (!data) return;

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
    await processImageAsset(result.assets[0]);
  }, [data, processImageAsset]);

  // Launch photo library to pick existing photos
  const handlePickFromLibrary = useCallback(async () => {
    if (!data) return;

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
    await processImageAsset(result.assets[0]);
  }, [data, processImageAsset]);

  const handleRemovePhoto = useCallback(
    async (photoId: string) => {
      // Skip temp photos
      if (photoId.startsWith("temp-")) {
        removePhoto(photoId);
        clearUploadProgress(photoId);
        return;
      }

      Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const client = getApiClient();
              await endpoints.deletePhoto(client, photoId);
              removePhoto(photoId);
            } catch (error) {
              console.error("Failed to delete photo:", error);
              Alert.alert("Error", "Failed to delete photo. Please try again.");
            }
          },
        },
      ]);
    },
    [removePhoto, clearUploadProgress]
  );

  // Network status for offline queueing
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable !== false;
  const queueSubmission = useOfflineQueueStore((s) => s.queueSubmission);
  const toast = useToast();

  const handleSubmit = useCallback(async () => {
    if (!data) return;

    setIsSubmitting(true);
    
    // Check if offline - queue for later
    if (!isOnline) {
      try {
        const tripReportData: TripReportData = {
          ascentId: data.ascentId,
          difficulty: difficulty ?? undefined,
          experience: experienceRating ?? undefined,
          notes: notes.trim() || undefined,
          tags: customTags.length > 0 ? customTags : undefined,
          conditionTags: conditionTags.length > 0 ? conditionTags : undefined,
        };

        // Queue photos that haven't been uploaded yet (pending ones)
        const pendingPhotos: PendingPhoto[] = photos
          .filter((p) => p.id.startsWith('temp-'))
          .map((p) => ({
            uri: p.thumbnailUrl,
            filename: `photo-${Date.now()}.jpg`,
            width: 0,
            height: 0,
          }));

        await queueSubmission('trip_report', tripReportData, pendingPhotos);
        
        toast.info(
          'Your report has been saved and will be uploaded when you\'re back online.',
          'Saved Offline'
        );
        closeModal();
      } catch (error) {
        console.error("Failed to queue report:", error);
        Alert.alert("Error", "Failed to save report offline. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Online - submit immediately
    try {
      const client = getApiClient();

      // Update ascent with form data
      await endpoints.updateAscent(client, {
        id: data.ascentId,
        timestamp: data.timestamp,
        peak_id: data.peakId,
        is_public: true,
        notes: notes.trim() || undefined,
        difficulty: difficulty ?? undefined,
        experience_rating: experienceRating ?? undefined,
        condition_tags: conditionTags.length > 0 ? conditionTags : undefined,
        custom_condition_tags: customTags.length > 0 ? customTags : undefined,
      });

      // Invalidate relevant queries to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ["peakDetails", data.peakId] });
      queryClient.invalidateQueries({ queryKey: ["peakPhotos", data.peakId] });
      queryClient.invalidateQueries({ queryKey: ["peakPublicSummits", data.peakId] });
      queryClient.invalidateQueries({ queryKey: ["userPeaks"] });
      queryClient.invalidateQueries({ queryKey: ["userJournal"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["recentSummits"] });
      // If this is an activity summit, also invalidate the activity detail
      if (data.activityId) {
        queryClient.invalidateQueries({ queryKey: ["activityDetail", String(data.activityId)] });
      }

      closeModal();
    } catch (error) {
      console.error("Failed to submit report:", error);
      Alert.alert("Error", "Failed to save report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [data, notes, difficulty, experienceRating, conditionTags, customTags, photos, closeModal, queryClient, setIsSubmitting, isOnline, queueSubmission, toast]);

  const handleAddCustomTag = useCallback(() => {
    if (customTagInput.trim()) {
      addCustomTag(customTagInput.trim());
      setCustomTagInput("");
    }
  }, [customTagInput, addCustomTag]);

  // Photo picker modal state
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

  // Fetch summit day photos using the hook
  // Only pass timestamp if it's a valid non-empty string
  const summitTimestamp = useMemo(() => {
    const ts = data?.timestamp;
    if (!ts || typeof ts !== 'string' || ts.trim() === '') {
      return null;
    }
    
    // Convert PostgreSQL timestamp format to ISO if needed
    // "2024-01-15 12:00:00+00" -> "2024-01-15T12:00:00+00:00"
    let normalized = ts.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}$/.test(normalized)) {
      normalized = normalized.replace(' ', 'T') + ':00';
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
      normalized = normalized.replace(' ', 'T');
    }
    
    // Validate it can be parsed as a date
    const testDate = new Date(normalized);
    if (isNaN(testDate.getTime())) {
      console.warn('[AddReportModal] Invalid timestamp format:', ts);
      return null;
    }
    return ts; // Return original, the hook will normalize it
  }, [data?.timestamp]);

  const {
    photos: summitDayPhotos,
    loading: summitDayPhotosLoading,
    permissionStatus,
    requestPermission,
  } = useSummitDayPhotos(summitTimestamp);

  // Track IDs of already selected/uploaded photos
  const selectedPhotoIds = useMemo(() => {
    return new Set(photos.map(p => p.id));
  }, [photos]);

  // Handle selecting a device photo (from inline section or full picker)
  const handleSelectDevicePhoto = useCallback(async (devicePhoto: DevicePhoto) => {
    if (!data) return;

    const tempPhotoId = `temp-${Date.now()}`;

    // Create temporary photo entry for UI
    const tempPhoto: SummitPhoto = {
      id: tempPhotoId,
      thumbnailUrl: devicePhoto.uri,
      fullUrl: devicePhoto.uri,
      caption: null,
      takenAt: null,
    };
    addPhoto(tempPhoto);

    // Set initial upload progress
    setUploadProgress(tempPhotoId, { progress: 0, status: "uploading" });

    try {
      const client = getApiClient();

      // Get signed upload URL
      const summitId = data.ascentId;
      if (!summitId) {
        Alert.alert("Error", "Cannot upload photo: missing summit ID.");
        removePhoto(tempPhotoId);
        clearUploadProgress(tempPhotoId);
        return;
      }

      console.log('[AddReportModal] Uploading photo with:', {
        summitType: data.summitType,
        summitId,
        ascentId: data.ascentId,
        activityId: data.activityId,
      });

      const uploadResponse = await endpoints.getPhotoUploadUrl(client, {
        filename: devicePhoto.filename,
        contentType: "image/jpeg",
        summitType: data.summitType,
        summitId,
      });

      setUploadProgress(tempPhotoId, { progress: 20, status: "uploading" });

      // Upload to GCS
      const response = await fetch(devicePhoto.uri);
      const blob = await response.blob();

      await fetch(uploadResponse.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: blob,
      });

      setUploadProgress(tempPhotoId, { progress: 70, status: "processing" });

      // Complete upload (triggers thumbnail generation)
      const completeResponse = await endpoints.completePhotoUpload(client, {
        photoId: uploadResponse.photoId,
        width: devicePhoto.width,
        height: devicePhoto.height,
        takenAt: undefined,
      });

      setUploadProgress(tempPhotoId, { progress: 100, status: "complete" });

      // Replace temp photo with real photo data
      removePhoto(tempPhotoId);
      clearUploadProgress(tempPhotoId);
      addPhoto({
        id: completeResponse.id,
        thumbnailUrl: completeResponse.thumbnailUrl,
        fullUrl: completeResponse.thumbnailUrl,
        caption: null,
        takenAt: null,
      });
    } catch (error) {
      console.error("Photo upload failed:", error);
      setUploadProgress(tempPhotoId, {
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      } as any);
      Alert.alert("Upload Failed", "Failed to upload photo. Please try again.");
      removePhoto(tempPhotoId);
      clearUploadProgress(tempPhotoId);
    }
  }, [data, addPhoto, removePhoto, setUploadProgress, clearUploadProgress]);

  // Handle photos selected from full picker modal
  const handlePhotosFromPicker = useCallback(async (selectedPhotos: DevicePhoto[]) => {
    // Upload each selected photo
    for (const photo of selectedPhotos) {
      await handleSelectDevicePhoto(photo);
    }
  }, [handleSelectDevicePhoto]);

  // Open full photo picker modal
  const handleOpenFullPicker = useCallback(() => {
    setPhotoPickerVisible(true);
  }, []);

  if (!data) return null;

  // Normalize PostgreSQL timestamp format before parsing
  // "2024-01-15 12:00:00+00" -> "2024-01-15T12:00:00+00:00"
  const normalizeTimestamp = (ts: string): string => {
    let normalized = ts.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}$/.test(normalized)) {
      normalized = normalized.replace(' ', 'T') + ':00';
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
      normalized = normalized.replace(' ', 'T');
    }
    return normalized;
  };

  const formattedDate = new Date(normalizeTimestamp(data.timestamp)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      {/* GestureHandlerRootView is required inside Modal for gesture-based components like PrimaryCTA */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Backdrop */}
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={closeModal}
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
              Add Report
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {data.peakName} · {formattedDate}
            </Text>
          </View>
          <TouchableOpacity onPress={closeModal} className="p-2 -mr-2">
            <X size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="px-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos Section - Camera First! */}
          <View className="py-4">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
              Photos
            </Text>
            <PhotoSection
              photos={photos}
              uploadProgress={uploadProgress}
              onPickFromLibrary={handlePickFromLibrary}
              onTakePhoto={handleTakePhoto}
              onRemovePhoto={handleRemovePhoto}
              onSelectDevicePhoto={handleSelectDevicePhoto}
              onOpenFullPicker={handleOpenFullPicker}
              accentColor={accentColor}
              isLoading={isLoadingPhotos}
              summitDayPhotos={summitDayPhotos}
              summitDayPhotosLoading={summitDayPhotosLoading}
              summitTimestamp={summitTimestamp}
              selectedPhotoIds={selectedPhotoIds}
            />
          </View>

          {/* Divider */}
          <View className="h-px" style={{ backgroundColor: colors.border }} />

          {/* Conditions Section */}
          <View className="py-4">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
              Conditions
            </Text>
            <ConditionTagsSection
              selectedTags={conditionTags}
              onToggle={toggleConditionTag}
              accentColor={accentColor}
            />
          </View>

          {/* Divider */}
          <View className="h-px" style={{ backgroundColor: colors.border }} />

          {/* Difficulty Section */}
          <View className="py-4">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
              Difficulty
            </Text>
            <DifficultyPicker
              selected={difficulty}
              onSelect={setDifficulty}
            />
          </View>

          {/* Divider */}
          <View className="h-px" style={{ backgroundColor: colors.border }} />

          {/* Experience Section */}
          <View className="py-4">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
              Experience
            </Text>
            <ExperiencePicker
              selected={experienceRating}
              onSelect={setExperienceRating}
            />
          </View>

          {/* Divider */}
          <View className="h-px" style={{ backgroundColor: colors.border }} />

          {/* Notes Section (Collapsible) */}
          <View className="py-4">
            <TouchableOpacity
              onPress={() => setNotesExpanded(!notesExpanded)}
              className="flex-row items-center justify-between"
            >
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
                Notes (optional)
              </Text>
              {notesExpanded ? (
                <ChevronUp size={18} color={colors.mutedForeground} />
              ) : (
                <ChevronDown size={18} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {notesExpanded && (
              <TextInput
                className="mt-3 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                placeholder="Share your experience..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            )}
          </View>

          {/* Divider */}
          <View className="h-px" style={{ backgroundColor: colors.border }} />

          {/* Custom Tags Section */}
          <View className="py-4">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
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
                onSubmitEditing={handleAddCustomTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddCustomTag}
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Plus size={20} color={accentColor} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: 34, // Safe area
          }}
        >
          <PrimaryCTA
            label={isSubmitting ? "Saving..." : "Submit Report"}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        </View>
        </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>

      {/* Full Photo Picker Modal */}
      <PhotoPickerModal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        onSelectPhotos={handlePhotosFromPicker}
        summitTimestamp={summitTimestamp}
        existingPhotoIds={selectedPhotoIds}
        accentColor={accentColor}
      />
    </Modal>
  );
};

export default AddReportModal;

