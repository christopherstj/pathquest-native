/**
 * PeakPhotosGallery
 *
 * Displays public photos for a peak in a grid layout with fullscreen viewer.
 * Uses GET /api/peaks/:id/photos endpoint.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { X, Camera, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { PublicPeakPhoto } from "@pathquest/shared/types";
import { endpoints } from "@pathquest/shared/api";
import { Text, CardFrame, EmptyState } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { getApiClient } from "@/src/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 4;
const NUM_COLUMNS = 3;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 32 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface PeakPhotosGalleryProps {
  peakId: string;
  limit?: number;
  /** Called when photographer name is tapped in the viewer */
  onPhotographerPress?: (userId: string) => void;
}

export const PeakPhotosGallery: React.FC<PeakPhotosGalleryProps> = ({ peakId, limit = 20, onPhotographerPress }) => {
  const { colors, isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const accentColor = colors.primary as string;
  const iconChipBg = `${accentColor}${isDark ? "22" : "18"}`;
  const iconChipBorder = `${accentColor}${isDark ? "3A" : "2A"}`;

  // Fetch photos for the peak
  const {
    data: photosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["peakPhotos", peakId],
    queryFn: async () => {
      const client = getApiClient();
      return await endpoints.getPeakPhotos(client, { peakId, limit });
    },
    enabled: !!peakId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const photos = photosData?.photos ?? [];

  const handlePhotoPress = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handlePrevious = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, photos.length]);

  // Loading state
  if (isLoading) {
    return (
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: iconChipBg as any,
              borderWidth: 1,
              borderColor: iconChipBorder as any,
            }}
          >
            <Camera size={16} color={accentColor as any} />
          </View>
          <Text className="text-foreground text-base font-semibold">Photos</Text>
        </View>
        <View style={{ height: 100, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color={accentColor} />
        </View>
      </View>
    );
  }

  // No photos state
  if (photos.length === 0) {
    return (
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: iconChipBg as any,
              borderWidth: 1,
              borderColor: iconChipBorder as any,
            }}
          >
            <Camera size={16} color={accentColor as any} />
          </View>
          <Text className="text-foreground text-base font-semibold">Photos</Text>
        </View>
        <EmptyState
          Icon={Camera}
          iconColor={accentColor}
          title="No photos yet"
          description="Be the first to share a photo from this peak!"
          seed={`photos-empty:${peakId}`}
        />
      </View>
    );
  }

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: iconChipBg as any,
            borderWidth: 1,
            borderColor: iconChipBorder as any,
          }}
        >
          <Camera size={16} color={accentColor as any} />
        </View>
        <Text className="text-foreground text-base font-semibold">
          Photos ({photos.length})
        </Text>
      </View>

      {/* Photo Grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: GRID_GAP,
        }}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id}
            onPress={() => handlePhotoPress(index)}
            activeOpacity={0.8}
            style={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: colors.muted,
            }}
          >
            <Image
              source={{ uri: photo.thumbnailUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Fullscreen Photo Viewer Modal */}
      <Modal
        visible={selectedIndex !== null}
        animationType="fade"
        transparent
        onRequestClose={handleCloseViewer}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={handleCloseViewer}
            style={{
              position: "absolute",
              top: 50,
              right: 16,
              zIndex: 10,
              padding: 8,
            }}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>

          {/* Navigation Arrows */}
          {selectedIndex !== null && selectedIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                marginTop: -24,
                zIndex: 10,
                padding: 8,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 24,
              }}
            >
              <ChevronLeft size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {selectedIndex !== null && selectedIndex < photos.length - 1 && (
            <TouchableOpacity
              onPress={handleNext}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                marginTop: -24,
                zIndex: 10,
                padding: 8,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 24,
              }}
            >
              <ChevronRight size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Photo */}
          <Pressable
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            onPress={handleCloseViewer}
          >
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.fullUrl }}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_WIDTH,
                }}
                resizeMode="contain"
              />
            )}
          </Pressable>

          {/* Caption and Attribution */}
          {selectedPhoto && (selectedPhoto.caption || selectedPhoto.userName || selectedPhoto.takenAt) && (
            <View
              style={{
                position: "absolute",
                bottom: 50,
                left: 16,
                right: 16,
                padding: 16,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 12,
              }}
            >
              {selectedPhoto.caption && (
                <Text style={{ color: "#fff", fontSize: 14, marginBottom: 8 }}>
                  {selectedPhoto.caption}
                </Text>
              )}
              {selectedPhoto.userName && (
                <TouchableOpacity
                  onPress={() => {
                    // TODO: When backend adds userId to PublicPeakPhoto, enable navigation
                    // onPhotographerPress?.((selectedPhoto as any).userId);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                    Photo by{" "}
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>
                      {selectedPhoto.userName}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
              {selectedPhoto.takenAt && (
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 }}>
                  {new Date(selectedPhoto.takenAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              )}
            </View>
          )}

          {/* Photo Counter */}
          {selectedIndex !== null && (
            <View
              style={{
                position: "absolute",
                top: 50,
                left: 0,
                right: 0,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14 }}>
                {selectedIndex + 1} / {photos.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default PeakPhotosGallery;

