/**
 * PhotoLightbox
 * 
 * Reusable fullscreen photo viewer modal with swipe navigation.
 * Works with both SummitPhoto (user's own photos) and PublicPeakPhoto (community photos).
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Modal,
  Image,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { SummitPhoto, PublicPeakPhoto } from "@pathquest/shared/types";
import { Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Photo = SummitPhoto | PublicPeakPhoto;

interface PhotoLightboxProps {
  /** Array of photos to display */
  photos: Photo[];
  /** Index of photo to show initially */
  initialIndex?: number;
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when photographer name is tapped (for PublicPeakPhoto) */
  onPhotographerPress?: (userId: string) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  initialIndex = 0,
  visible,
  onClose,
  onPhotographerPress,
}) => {
  const { colors } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Reset selected index when visible changes
  React.useEffect(() => {
    if (visible) {
      setSelectedIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const handlePrevious = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, photos.length]);

  if (photos.length === 0) return null;

  const selectedPhoto = photos[selectedIndex];
  const isPublicPhoto = "userName" in selectedPhoto;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
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
        {selectedIndex > 0 && (
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

        {selectedIndex < photos.length - 1 && (
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
          onPress={onClose}
        >
          <Image
            source={{ uri: selectedPhoto.fullUrl }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH,
            }}
            resizeMode="contain"
          />
        </Pressable>

        {/* Caption and Attribution */}
        {(selectedPhoto.caption || (isPublicPhoto && selectedPhoto.userName) || selectedPhoto.takenAt) && (
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
            {isPublicPhoto && selectedPhoto.userName && (
              <TouchableOpacity
                onPress={() => {
                  // TODO: When backend adds userId to PublicPeakPhoto, enable navigation
                  // onPhotographerPress?.((selectedPhoto as PublicPeakPhoto).userId);
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
      </View>
    </Modal>
  );
};

