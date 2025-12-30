/**
 * ContentSheet
 * 
 * A draggable bottom sheet that overlays the map, similar to the web frontend's
 * ContentSheet. Uses @gorhom/bottom-sheet with 3 snap points:
 * - Collapsed (~60px): Just the drag handle visible
 * - Halfway (~45%): Default state, map partially visible
 * - Expanded (~90%): Full screen content
 * 
 * Supports swipe gestures with velocity detection for smooth snapping.
 */

import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSheetStore } from '@/src/store/sheetStore';

interface ContentSheetProps {
  children: React.ReactNode;
  /**
   * Bottom padding to account for tab bar (default: 60)
   */
  bottomPadding?: number;
}

export interface ContentSheetRef {
  expand: () => void;
  collapse: () => void;
  snapToIndex: (index: number) => void;
}

const ContentSheet = forwardRef<ContentSheetRef, ContentSheetProps>(
  ({ children, bottomPadding = 60 }, ref) => {
    const { height: windowHeight } = useWindowDimensions();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const setSnapIndex = useSheetStore((state) => state.setSnapIndex);

    // Calculate snap points based on window height
    // Account for status bar (~44px) and tab bar (bottomPadding)
    const snapPoints = useMemo(() => {
      const collapsedHeight = 80; // Drag handle + peek
      const halfwayHeight = Math.round(windowHeight * 0.45);
      const expandedHeight = windowHeight - 100; // Leave some space at top
      
      return [collapsedHeight, halfwayHeight, expandedHeight];
    }, [windowHeight]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      expand: () => bottomSheetRef.current?.snapToIndex(2),
      collapse: () => bottomSheetRef.current?.snapToIndex(0),
      snapToIndex: (index: number) => bottomSheetRef.current?.snapToIndex(index),
    }));

    // Handle snap index changes
    const handleSheetChanges = useCallback((index: number) => {
      setSnapIndex(index);
    }, [setSnapIndex]);

    // Custom backdrop (optional - subtle fade when expanded)
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={1}
          appearsOnIndex={2}
          opacity={0.3}
        />
      ),
      []
    );

    // Custom handle indicator
    const renderHandle = useCallback(() => (
      <View className="items-center justify-center py-3">
        <View className="w-10 h-1 rounded-sm bg-muted-foreground opacity-50" />
      </View>
    ), []);

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={1} // Start at halfway
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        handleComponent={renderHandle}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: 'rgba(22, 17, 7, 0.92)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0.5,
          borderColor: 'rgba(69, 65, 60, 0.7)',
        }}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
        bottomInset={bottomPadding}
        enablePanDownToClose={false}
        enableOverDrag={true}
        animateOnMount={true}
      >
        <BottomSheetView className="flex-1">
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

ContentSheet.displayName = 'ContentSheet';

export default ContentSheet;
