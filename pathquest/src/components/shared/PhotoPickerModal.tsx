/**
 * PhotoPickerModal
 * 
 * Full-screen modal for selecting photos from the device's media library.
 * Shows "Photos from this day" section at top (summit day photos),
 * followed by "Recent Photos" section.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Camera, ImageIcon, Settings } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import { usePhotoPicker, type DevicePhoto } from '@/src/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const GRID_GAP = 2;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - (NUM_COLUMNS + 1) * GRID_GAP) / NUM_COLUMNS;

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPhotos: (photos: DevicePhoto[]) => void;
  summitTimestamp: string | null;
  /** IDs of photos already selected/uploaded */
  existingPhotoIds?: Set<string>;
  accentColor?: string;
}

interface PhotoThumbnailProps {
  photo: DevicePhoto;
  isSelected: boolean;
  onToggle: () => void;
  accentColor: string;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
  photo,
  isSelected,
  onToggle,
  accentColor,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        margin: GRID_GAP / 2,
      }}
    >
      <Image
        source={{ uri: photo.uri }}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.muted,
        }}
        resizeMode="cover"
      />
      {isSelected && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: accentColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Check size={14} color="#fff" strokeWidth={3} />
          </View>
        </View>
      )}
      {!isSelected && (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.8)',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        />
      )}
    </TouchableOpacity>
  );
};

interface SectionHeaderProps {
  title: string;
  highlighted?: boolean;
  accentColor: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  highlighted,
  accentColor,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: highlighted
          ? isDark
            ? `${accentColor}20`
            : `${accentColor}15`
          : 'transparent',
        borderLeftWidth: highlighted ? 3 : 0,
        borderLeftColor: accentColor,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: highlighted ? accentColor : colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  visible,
  onClose,
  onSelectPhotos,
  summitTimestamp,
  existingPhotoIds = new Set(),
  accentColor,
}) => {
  const { colors, isDark } = useTheme();
  const color = accentColor ?? colors.primary;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    summitDayPhotos,
    recentPhotos,
    loading,
    error,
    hasMoreRecent,
    loadMoreRecent,
    refresh,
    permissionStatus,
    isGranted,
    requestPermission,
  } = usePhotoPicker(summitTimestamp);

  // Format the summit date for display
  const formattedDate = useMemo(() => {
    if (!summitTimestamp) return 'this day';
    try {
      return format(new Date(summitTimestamp), 'MMM d, yyyy');
    } catch {
      return 'this day';
    }
  }, [summitTimestamp]);

  // Toggle photo selection
  const toggleSelection = useCallback((photoId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }, []);

  // Handle done button
  const handleDone = useCallback(() => {
    // Collect selected photos from both sections
    const allPhotos = [...summitDayPhotos, ...recentPhotos];
    const selectedPhotos = allPhotos.filter(p => selectedIds.has(p.id));
    onSelectPhotos(selectedPhotos);
    setSelectedIds(new Set());
    onClose();
  }, [summitDayPhotos, recentPhotos, selectedIds, onSelectPhotos, onClose]);

  // Handle camera capture
  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      // Create a DevicePhoto-like object for the captured photo
      const capturedPhoto: DevicePhoto = {
        id: `captured-${Date.now()}`,
        uri: asset.uri,
        filename: asset.fileName ?? `photo-${Date.now()}.jpg`,
        width: asset.width,
        height: asset.height,
        creationTime: Date.now(),
      };
      onSelectPhotos([capturedPhoto]);
      onClose();
    }
  }, [onSelectPhotos, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  // Use system photo picker (works without permissions on Android 13+)
  const handleUseSystemPicker = useCallback(async () => {
    console.log('[PhotoPickerModal] Opening system photo picker...');
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true,
        selectionLimit: 10, // Limit to 10 photos at a time
      });
      
      console.log('[PhotoPickerModal] System picker result:', result.canceled ? 'canceled' : `${result.assets?.length || 0} photos selected`);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Convert ImagePicker assets to DevicePhoto format
        const selectedPhotos: DevicePhoto[] = result.assets.map((asset, index) => ({
          id: `system-picker-${Date.now()}-${index}`,
          uri: asset.uri,
          filename: asset.fileName ?? `photo-${Date.now()}-${index}.jpg`,
          width: asset.width,
          height: asset.height,
          creationTime: asset.exif?.DateTimeOriginal ? new Date(asset.exif.DateTimeOriginal).getTime() : Date.now(),
        }));
        
        onSelectPhotos(selectedPhotos);
        onClose();
      }
    } catch (error) {
      console.error('[PhotoPickerModal] System picker error:', error);
    }
  }, [onSelectPhotos, onClose]);

  // Request permission for media library access (to show day-of photos)
  const handleRequestPermission = useCallback(async () => {
    console.log('[PhotoPickerModal] Allow Access button tapped');
    
    // If already permanently denied on Android, open settings
    if (permissionStatus === 'denied' && Platform.OS === 'android') {
      console.log('[PhotoPickerModal] Permission denied, opening settings...');
      Linking.openSettings();
      return;
    }
    
    const granted = await requestPermission();
    console.log('[PhotoPickerModal] Permission granted:', granted);
    // The hook will automatically trigger photo loading when permission is granted
  }, [requestPermission, permissionStatus]);

  // Build flat list data with section headers
  const listData = useMemo(() => {
    const data: Array<{ type: 'header' | 'photo'; key: string; photo?: DevicePhoto; title?: string; highlighted?: boolean }> = [];

    // Summit day section
    if (summitDayPhotos.length > 0) {
      data.push({
        type: 'header',
        key: 'header-summit',
        title: `Photos from ${formattedDate}`,
        highlighted: true,
      });
      summitDayPhotos.forEach(photo => {
        if (!existingPhotoIds.has(photo.id)) {
          data.push({ type: 'photo', key: photo.id, photo });
        }
      });
    }

    // Recent photos section
    if (recentPhotos.length > 0 || summitDayPhotos.length === 0) {
      data.push({
        type: 'header',
        key: 'header-recent',
        title: 'Recent Photos',
        highlighted: false,
      });
      recentPhotos.forEach(photo => {
        if (!existingPhotoIds.has(photo.id)) {
          data.push({ type: 'photo', key: photo.id, photo });
        }
      });
    }

    return data;
  }, [summitDayPhotos, recentPhotos, formattedDate, existingPhotoIds]);

  // Group photos into rows for manual grid layout
  const groupedData = useMemo(() => {
    const grouped: Array<{ type: 'header' | 'row'; key: string; items?: DevicePhoto[]; title?: string; highlighted?: boolean }> = [];
    let currentRow: DevicePhoto[] = [];

    listData.forEach((item) => {
      if (item.type === 'header') {
        // Flush current row if any
        if (currentRow.length > 0) {
          grouped.push({ type: 'row', key: `row-${grouped.length}`, items: [...currentRow] });
          currentRow = [];
        }
        // Add header
        grouped.push({ type: 'header', key: item.key, title: item.title, highlighted: item.highlighted });
      } else if (item.photo) {
        currentRow.push(item.photo);
        // If row is full, flush it
        if (currentRow.length === NUM_COLUMNS) {
          grouped.push({ type: 'row', key: `row-${grouped.length}`, items: [...currentRow] });
          currentRow = [];
        }
      }
    });

    // Flush remaining photos
    if (currentRow.length > 0) {
      grouped.push({ type: 'row', key: `row-${grouped.length}`, items: currentRow });
    }

    return grouped;
  }, [listData]);

  // Render list item
  const renderItem = useCallback(({ item }: { item: typeof groupedData[0] }) => {
    if (item.type === 'header') {
      return (
        <SectionHeader
          title={item.title!}
          highlighted={item.highlighted}
          accentColor={color}
        />
      );
    }

    if (item.type === 'row' && item.items) {
      return (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: GRID_GAP / 2,
            marginBottom: GRID_GAP,
          }}
        >
          {item.items.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              isSelected={selectedIds.has(photo.id)}
              onToggle={() => toggleSelection(photo.id)}
              accentColor={color}
            />
          ))}
          {/* Fill remaining columns with empty space */}
          {Array.from({ length: NUM_COLUMNS - item.items.length }).map((_, i) => (
            <View key={`spacer-${i}`} style={{ width: THUMBNAIL_SIZE, margin: GRID_GAP / 2 }} />
          ))}
        </View>
      );
    }

    return null;
  }, [selectedIds, toggleSelection, color]);


  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (hasMoreRecent && !loading) {
      loadMoreRecent();
    }
  }, [hasMoreRecent, loading, loadMoreRecent]);

  const selectedCount = selectedIds.size;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: colors.foreground,
            }}
          >
            Select Photos
          </Text>

          <TouchableOpacity
            onPress={handleDone}
            disabled={selectedCount === 0}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: selectedCount > 0 ? color : colors.muted,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: selectedCount > 0 ? '#fff' : colors.mutedForeground,
              }}
            >
              {selectedCount > 0 ? `Done (${selectedCount})` : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons row */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: isDark ? colors.card : colors.muted,
            }}
          >
            <Camera size={20} color={color} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.foreground }}>
              Take Photo
            </Text>
          </TouchableOpacity>
          
          {/* Browse All button - uses system picker, works on all Android versions */}
          <TouchableOpacity
            onPress={handleUseSystemPicker}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: isDark ? colors.card : colors.muted,
            }}
          >
            <ImageIcon size={20} color={color} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.foreground }}>
              Browse All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Permission prompt - show when we don't have media library access */}
        {!isGranted && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 32,
            }}
          >
            <ImageIcon size={48} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: colors.foreground,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              Select Your Summit Photos
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                marginTop: 8,
                textAlign: 'center',
                paddingHorizontal: 16,
              }}
            >
              Use "Browse All" above to select photos from your device, or take a new photo with "Take Photo".
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginTop: 16,
                textAlign: 'center',
                paddingHorizontal: 16,
                fontStyle: 'italic',
              }}
            >
              Automatic "day-of photos" filtering requires an app update.
            </Text>
            {/* Big Browse All button as primary CTA */}
            <TouchableOpacity
              onPress={handleUseSystemPicker}
              style={{
                marginTop: 24,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 24,
                backgroundColor: color,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <ImageIcon size={20} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                Browse All Photos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading state */}
        {isGranted && loading && listData.length === 0 && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={color} />
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                marginTop: 12,
              }}
            >
              Loading photos...
            </Text>
          </View>
        )}

        {/* Error state */}
        {error && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 32,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.destructive,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => refresh()}
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: colors.muted,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.foreground }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Photo grid */}
        {isGranted && !error && (
          <FlatList
            data={groupedData}
            renderItem={renderItem}
            keyExtractor={item => item.key}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && groupedData.length > 0 ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={color} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 60,
                  }}
                >
                  <ImageIcon size={48} color={colors.mutedForeground} />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.mutedForeground,
                      marginTop: 12,
                      textAlign: 'center',
                    }}
                  >
                    No photos found
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={{
              paddingBottom: 20,
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default PhotoPickerModal;

