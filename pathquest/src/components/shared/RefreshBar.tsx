/**
 * RefreshBar
 * 
 * A thin animated loading bar that appears at the top of screens
 * when data is refreshing. Uses an indeterminate shimmer animation.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';

interface RefreshBarProps {
  /** Whether the bar should be visible and animating */
  isRefreshing: boolean;
  /** Height of the bar in pixels (default: 2) */
  height?: number;
}

export function RefreshBar({ isRefreshing, height = 2 }: RefreshBarProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(-1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRefreshing) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // Start shimmer animation loop
      const shimmer = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      shimmer.start();

      return () => shimmer.stop();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRefreshing, translateX, opacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height,
          backgroundColor: `${colors.primary}30`,
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: colors.primary,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-100%' as any, '100%' as any],
                }),
              },
            ],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  shimmer: {
    width: '50%',
    height: '100%',
  },
});

